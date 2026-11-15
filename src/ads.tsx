import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, Alert, AppState, useWindowDimensions } from 'react-native';
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
  completedAction: async () => {},
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
  async function completedAction() {
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
        completedAction,
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
    window = useWindowDimensions(),
    [width, setWidth] = useState(Math.floor(window.width - 44)),
    [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false),
    t = useTheme();
  useEffect(() => {
    setLoaded(false);
  }, [width, ready]);
  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => {
      setFailed(false);
      setLoaded(false);
    }, 60000);
    return () => clearTimeout(timer);
  }, [failed]);
  if (!ready || failed) return null;
  return (
    <View
      testID="ad-slot"
      onLayout={event => {
        const measured = Math.floor(event.nativeEvent.layout.width);
        if (measured > 0) setWidth(measured);
      }}
      style={{
        alignItems: 'center',
        width: '100%',
        backgroundColor: t.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: loaded ? 18 : 0,
        opacity: loaded ? 1 : 0,
        maxHeight: loaded ? undefined : 1,
      }}
    >
      <View
        style={{
          alignSelf: 'stretch',
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 9, letterSpacing: 1.5, color: t.muted }}>
          ADVERTISEMENT
        </Text>
      </View>
      <BannerAd
        key={width}
        unitId={__DEV__ || native?.QA_BUILD ? TestIds.BANNER : BANNER}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        width={width}
        maxHeight={180}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          setLoaded(true);
          console.info('ThingsToDo ads: banner loaded');
        }}
        onAdFailedToLoad={error => {
          console.warn('ThingsToDo ads: banner unavailable', error.message);
          setLoaded(false);
          setFailed(true);
        }}
      />
    </View>
  );
}
