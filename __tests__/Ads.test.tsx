import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdsProvider, SafeAdContainer, useAds } from '../src/ads';
import { BannerAd } from 'react-native-google-mobile-ads';

const mockConsent = jest.fn();
const mockConsentInfo = jest.fn();
const mockInitialize = jest.fn();
const mockConfigure = jest.fn();
const mockShow = jest.fn();
const mockListeners: Record<string, () => void> = {};
jest.mock('../src/theme', () => ({
  useTheme: () => ({ surface: '#fff', muted: '#111' }),
}));
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    initialize: mockInitialize,
    setRequestConfiguration: mockConfigure,
  }),
  AdsConsent: {
    gatherConsent: () => mockConsent(),
    getConsentInfo: () => mockConsentInfo(),
    showPrivacyOptionsForm: () => mockConsent(),
  },
  MaxAdContentRating: { PG: 'PG' },
  TestIds: { INTERSTITIAL: 'test-interstitial', BANNER: 'test-banner' },
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'adaptive' },
  BannerAd: () => null,
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  InterstitialAd: {
    createForAdRequest: () => ({
      addAdEventListener: (event: string, fn: () => void) => {
        mockListeners[event] = fn;
        return () => {};
      },
      removeAllListeners: () => {},
      load: () => {},
      show: () => mockShow(),
    }),
  },
}));
let tree: Renderer.ReactTestRenderer | undefined;
let ads: ReturnType<typeof useAds>;
function Probe() {
  ads = useAds();
  return (
    <>
      <Text>Application remains available</Text>
      <SafeAdContainer />
    </>
  );
}
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <AdsProvider>
        <Probe />
      </AdsProvider>,
    );
  });
}
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockConsent.mockResolvedValue({ canRequestAds: true });
  mockConsentInfo.mockResolvedValue({ canRequestAds: false });
  mockInitialize.mockResolvedValue([]);
  mockConfigure.mockResolvedValue(undefined);
  mockShow.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});
test('ads initialize automatically without a hidden settings switch', async () => {
  await mount();
  expect(mockConsent).toHaveBeenCalledTimes(1);
  expect(mockInitialize).toHaveBeenCalledTimes(1);
  expect(ads.ready).toBe(true);
  expect(
    tree!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Application remains available'),
  ).toBe(true);
});
test('consent network failure leaves core application available with ads off', async () => {
  mockConsent.mockRejectedValueOnce(new Error('Network unavailable'));
  await mount();
  expect(ads.ready).toBe(false);
  expect(mockInitialize).not.toHaveBeenCalled();
  expect(tree!.root.findByType(Text).props.children).toBe(
    'Application remains available',
  );
});
test('failed banner disappears without removing application content', async () => {
  await mount();
  expect(ads.ready).toBe(true);
  await act(async () =>
    tree!.root
      .findByType(BannerAd)
      .props.onAdFailedToLoad(new Error('No fill')),
  );
  expect(tree!.root.findAllByType(BannerAd)).toHaveLength(0);
  expect(tree!.root.findByType(Text).props.children).toBe(
    'Application remains available',
  );
});
test('interstitial is capped and a failed show never rejects the completed action', async () => {
  const began = Date.now();
  let now = began;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  await mount();
  mockListeners.loaded();
  await ads.completedVisit();
  expect(mockShow).not.toHaveBeenCalled();
  now += 6 * 60000;
  mockShow.mockRejectedValueOnce(new Error('Ad unavailable'));
  await expect(ads.completedVisit()).resolves.toBeUndefined();
  expect(mockShow).toHaveBeenCalledTimes(1);
  mockListeners.loaded();
  now += 60000;
  await ads.completedVisit();
  expect(mockShow).toHaveBeenCalledTimes(1);
});

test('previous Google consent can authorize ads when the refresh fails', async () => {
  mockConsent.mockRejectedValueOnce(new Error('Offline'));
  mockConsentInfo.mockResolvedValueOnce({ canRequestAds: true });
  await mount();
  expect(mockInitialize).toHaveBeenCalledTimes(1);
  expect(ads.ready).toBe(true);
});
test('Google consent eligibility still gates ad requests', async () => {
  mockConsent.mockResolvedValueOnce({ canRequestAds: false });
  await mount();
  expect(mockInitialize).not.toHaveBeenCalled();
  expect(ads.ready).toBe(false);
});
test('a failed banner retries after a minute', async () => {
  jest.useFakeTimers();
  try {
    await mount();
    await act(async () =>
      tree!.root
        .findByType(BannerAd)
        .props.onAdFailedToLoad(new Error('No fill')),
    );
    expect(tree!.root.findAllByType(BannerAd)).toHaveLength(0);
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    expect(tree!.root.findAllByType(BannerAd)).toHaveLength(1);
  } finally {
    jest.useRealTimers();
  }
});

test('an unavailable privacy form does not turn working ads off', async () => {
  await mount();
  mockConsentInfo.mockResolvedValueOnce({
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  });
  await act(async () => ads.privacy());
  expect(ads.ready).toBe(true);
  expect(mockConsent).toHaveBeenCalledTimes(1);
});

test('privacy changes stop ads if Google no longer permits requests', async () => {
  await mount();
  mockConsentInfo.mockResolvedValueOnce({
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'REQUIRED',
  });
  mockConsent.mockResolvedValueOnce({ canRequestAds: false });
  await act(async () => ads.privacy());
  expect(ads.ready).toBe(false);
});
