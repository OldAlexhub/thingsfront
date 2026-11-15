import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, Alert, AppState } from 'react-native';
import mobileAds, {
  AdsConsent,
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { native } from './api';
import { useTheme } from './theme';
const BANNER = 'ca-app-pub-7831002909037560/2277947348',
  INTERSTITIAL = 'ca-app-pub-7831002909037560/2637039990';
const Context = createContext({
  ready: false,
  status: 'Checking advertising availability.',
  retry: () => {},
  privacy: async () => {},
  completedVisit: async () => {},
});
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [status, setStatus] = useState('Checking advertising availability.'),
    [attempt, setAttempt] = useState(0),
    ad = useRef<InterstitialAd | null>(null),
    loaded = useRef(false),
    start = useRef(Date.now()),
    busy = useRef(false);
  useEffect(() => {
    let alive = true;
    setStatus('Checking advertising availability.');
    void (async () => {
      try {
        const consent = await AdsConsent.gatherConsent().catch(() =>
          AdsConsent.getConsentInfo(),
        );
        if (!alive) return;
        if (!consent.canRequestAds) {
          setReady(false);
          setStatus(
            'Google has not enabled ad requests yet. Check advertising privacy choices.',
          );
          return;
        }
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          ...(__DEV__ || native?.QA_BUILD
            ? { testDeviceIdentifiers: ['EMULATOR'] }
            : {}),
        });
        if (!alive) return;
        await mobileAds().initialize();
        if (alive) {
          setReady(true);
          setStatus('Advertising is active. Availability depends on Google.');
        }
      } catch (error) {
        if (alive) {
          setReady(false);
          setStatus('Advertising could not start: ' + (error as Error).message);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', value => {
      if (value === 'active' && !ready) setAttempt(v => v + 1);
    });
    return () => subscription.remove();
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const interstitial = InterstitialAd.createForAdRequest(
      __DEV__ || native?.QA_BUILD ? TestIds.INTERSTITIAL : INTERSTITIAL,
      { requestNonPersonalizedAdsOnly: true },
    );
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    ad.current = interstitial;
    const callbacks = [
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        loaded.current = true;
        console.info('ThingsToDo ads: interstitial loaded');
      }),
      interstitial.addAdEventListener(AdEventType.ERROR, error => {
        loaded.current = false;
        console.warn('ThingsToDo ads: interstitial unavailable', error.message);
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => interstitial.load(), 60000);
      }),
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        loaded.current = false;
        interstitial.load();
      }),
    ];
    interstitial.load();
    return () => {
      clearTimeout(retryTimer);
      callbacks.forEach(fn => fn());
      interstitial.removeAllListeners();
      ad.current = null;
      loaded.current = false;
    };
  }, [ready]);
  async function privacy() {
    try {
      const info = await AdsConsent.getConsentInfo();
      if (info.privacyOptionsRequirementStatus !== 'REQUIRED') {
        Alert.alert(
          'Privacy choices',
          'Google is not offering an advertising privacy form right now.',
        );
        return;
      }
      setReady(false);
      loaded.current = false;
      const consent = await AdsConsent.showPrivacyOptionsForm().catch(() =>
        AdsConsent.getConsentInfo(),
      );
      if (consent.canRequestAds) {
        await mobileAds().initialize();
        setReady(true);
        setStatus('Advertising is active. Availability depends on Google.');
      } else {
        setStatus(
          'Google has not enabled ad requests yet. Check advertising privacy choices.',
        );
      }
    } catch {
      Alert.alert(
        'Privacy choices',
        'Privacy choices could not be checked. Please try again.',
      );
    }
  }
  async function completedVisit() {
    if (
      !ready ||
      !loaded.current ||
      busy.current ||
      Date.now() - start.current < 5 * 60000
    )
      return;
    busy.current = true;
    try {
      const raw = await AsyncStorage.getItem('ttd:ad-cap');
      const cap = raw ? JSON.parse(raw) : { day: '', count: 0, last: 0 };
      const day = new Date().toISOString().slice(0, 10);
      if (cap.day !== day) cap.count = 0;
      if (cap.count >= 3 || Date.now() - cap.last < 15 * 60000) return;
      await AsyncStorage.setItem(
        'ttd:ad-cap',
        JSON.stringify({ day, count: cap.count + 1, last: Date.now() }),
      );
      loaded.current = false;
      await ad.current?.show();
    } catch {
      /* Ads never interrupt the completed action on failure. */
    } finally {
      busy.current = false;
    }
  }
  return (
    <Context.Provider
      value={{
        ready,
        status,
        retry: () => setAttempt(v => v + 1),
        privacy,
        completedVisit,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAds() {
  return useContext(Context);
}
export function SafeAdContainer() {
  const { ready } = useAds(),
    [failed, setFailed] = useState(false),
    t = useTheme();
  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => setFailed(false), 60000);
    return () => clearTimeout(timer);
  }, [failed]);
  if (!ready || failed) return null;
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 16,
        marginVertical: 10,
        backgroundColor: t.surface,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 2,
          color: t.muted,
          marginBottom: 6,
        }}
      >
        ADVERTISEMENT
      </Text>
      <BannerAd
        unitId={__DEV__ || native?.QA_BUILD ? TestIds.BANNER : BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => console.info('ThingsToDo ads: banner loaded')}
        onAdFailedToLoad={error => {
          console.warn('ThingsToDo ads: banner unavailable', error.message);
          setFailed(true);
        }}
      />
    </View>
  );
}
