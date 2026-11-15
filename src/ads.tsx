import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, Alert } from 'react-native';
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
import { useLocal } from './storage';
import { useTheme } from './theme';
const BANNER = 'ca-app-pub-7831002909037560/2277947348',
  INTERSTITIAL = 'ca-app-pub-7831002909037560/2637039990';
const Context = createContext({
  ready: false,
  privacy: async () => {},
  completedVisit: async () => {},
});
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useLocal(),
    [ready, setReady] = useState(false),
    ad = useRef<InterstitialAd | null>(null),
    loaded = useRef(false),
    start = useRef(Date.now()),
    busy = useRef(false);
  useEffect(() => {
    let alive = true;
    if (!state.ageConfirmed) {
      setReady(false);
      return;
    }
    void (async () => {
      try {
        const consent = await AdsConsent.gatherConsent();
        if (!consent.canRequestAds || !alive) return;
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          ...(__DEV__ || native?.QA_BUILD
            ? { testDeviceIdentifiers: ['EMULATOR'] }
            : {}),
        });
        if (!alive) return;
        await mobileAds().initialize();
        if (alive) setReady(true);
      } catch {
        if (alive) setReady(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [state.ageConfirmed]);
  useEffect(() => {
    if (!ready) return;
    const interstitial = InterstitialAd.createForAdRequest(
      __DEV__ || native?.QA_BUILD ? TestIds.INTERSTITIAL : INTERSTITIAL,
      { requestNonPersonalizedAdsOnly: true },
    );
    ad.current = interstitial;
    const callbacks = [
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        loaded.current = true;
      }),
      interstitial.addAdEventListener(AdEventType.ERROR, () => {
        loaded.current = false;
      }),
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        loaded.current = false;
        interstitial.load();
      }),
    ];
    interstitial.load();
    return () => {
      callbacks.forEach(fn => fn());
      interstitial.removeAllListeners();
      ad.current = null;
      loaded.current = false;
    };
  }, [ready]);
  async function privacy() {
    setReady(false);
    loaded.current = false;
    try {
      const consent = await AdsConsent.showPrivacyOptionsForm();
      if (consent.canRequestAds && state.ageConfirmed) {
        await mobileAds().initialize();
        setReady(true);
      }
    } catch {
      Alert.alert(
        'Privacy choices',
        'A privacy form is not available right now. Ads remain off until consent is checked again.',
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
    <Context.Provider value={{ ready, privacy, completedVisit }}>
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
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
