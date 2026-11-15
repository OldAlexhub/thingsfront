import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdsProvider, SafeAdContainer, useAds } from '../src/ads';
import { BannerAd } from 'react-native-google-mobile-ads';

let mockAdult = false;
const mockConsent = jest.fn();
const mockInitialize = jest.fn();
const mockConfigure = jest.fn();
const mockShow = jest.fn();
const mockListeners: Record<string, () => void> = {};
jest.mock('../src/storage', () => ({
  useLocal: () => ({ state: { ageConfirmed: mockAdult } }),
}));
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
  mockAdult = false;
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockConsent.mockResolvedValue({ canRequestAds: true });
  mockInitialize.mockResolvedValue([]);
  mockConfigure.mockResolvedValue(undefined);
  mockShow.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});
test('ads do not request consent or initialize without adult confirmation', async () => {
  await mount();
  expect(mockConsent).not.toHaveBeenCalled();
  expect(mockInitialize).not.toHaveBeenCalled();
  expect(ads.ready).toBe(false);
  expect(tree!.root.findByType(Text).props.children).toBe(
    'Application remains available',
  );
});
test('consent network failure leaves core application available with ads off', async () => {
  mockAdult = true;
  mockConsent.mockRejectedValueOnce(new Error('Network unavailable'));
  await mount();
  expect(ads.ready).toBe(false);
  expect(mockInitialize).not.toHaveBeenCalled();
  expect(tree!.root.findByType(Text).props.children).toBe(
    'Application remains available',
  );
});
test('failed banner disappears without removing application content', async () => {
  mockAdult = true;
  await mount();
  expect(ads.ready).toBe(true);
  await act(async () =>
    tree!.root.findByType(BannerAd).props.onAdFailedToLoad(),
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
  mockAdult = true;
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
