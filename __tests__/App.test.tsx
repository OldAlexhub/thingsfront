/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LocalProvider,
  useLocal,
  normalizeState,
  initialState,
} from '../src/storage';
import { api, ApiError, clearCache, query } from '../src/api';
import type { Activity } from '../src/types';

const item: Activity = {
  _id: 'a',
  cityId: 'c',
  title: 'Saved experience',
  images: [],
  tags: [],
  audience: [],
  categories: [],
  source: 'manual',
};
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test('personal data loads and favorite changes survive a provider remount', async () => {
  let store: ReturnType<typeof useLocal>;
  function Probe() {
    store = useLocal();
    return (
      <Text>{store.ready ? store.state.favorites.length : 'loading'}</Text>
    );
  }
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <LocalProvider>
        <Probe />
      </LocalProvider>,
    );
  });
  await ReactTestRenderer.act(async () => {
    store!.toggleSave(item);
  });
  expect(store!.state.favorites).toHaveLength(1);
  await ReactTestRenderer.act(async () => tree!.unmount());
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <LocalProvider>
        <Probe />
      </LocalProvider>,
    );
  });
  expect(store!.state.favorites[0].title).toBe('Saved experience');
  await ReactTestRenderer.act(async () => tree!.unmount());
});
test('expired licensed snapshots lose their content while preserving the saved identifier', () => {
  const result = normalizeState({
    ...initialState,
    favorites: [
      {
        ...item,
        source: 'osm',
        expiresAt: '2000-01-01',
        description: 'Restricted content',
      },
    ],
  });
  expect(result.favorites[0]._id).toBe('a');
  expect(result.favorites[0].description).toBeUndefined();
  expect(result.favorites[0].unavailable).toBe(true);
});
test('network failure serves permitted cache with a visible cache timestamp', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [item] }) })
    .mockRejectedValueOnce(new Error('offline'));
  await api('/test');
  const offline = await api('/test');
  expect(offline.cachedAt).toBeDefined();
  expect(offline.data).toEqual([item]);
});
test('404 never revives unpublished content from cache', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: item }) })
    .mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'No longer published' } }),
    });
  await api('/deleted');
  await expect(api('/deleted')).rejects.toMatchObject({ status: 404 });
});
test('expired provider cache is not served offline', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ...item, expiresAt: '2000-01-01' } }),
    })
    .mockRejectedValueOnce(new Error('offline'));
  await api('/expired');
  await expect(api('/expired')).rejects.toBeInstanceOf(ApiError);
});
test('clearing cache preserves local plans', async () => {
  await AsyncStorage.setItem('ttd:personal:v1', 'kept');
  await AsyncStorage.setItem('ttd:cache:test', 'removed');
  await clearCache();
  expect(await AsyncStorage.getItem('ttd:personal:v1')).toBe('kept');
  expect(await AsyncStorage.getItem('ttd:cache:test')).toBeNull();
});
test('zero budget is not dropped from query parameters', () =>
  expect(query({ budget: 0, q: 'park & lake', category: undefined })).toBe(
    'budget=0&q=park%20%26%20lake',
  ));
