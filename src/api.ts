import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
export const native = NativeModules.ThingsToDoNative as {
  API_BASE_URL?: string;
  QA_BUILD?: boolean;
  VERSION_CODE?: number;
  VERSION_NAME?: string;
  checkForUpdate: (immediate: boolean) => Promise<string>;
  getLocation: () => Promise<{ latitude: number; longitude: number }>;
  exportFile: (filename: string, content: string) => Promise<string>;
  shareMemory: (uri: string, caption: string) => Promise<void>;
  saveMemoryImage: (uri: string) => Promise<string>;
  copyText: (text: string) => Promise<void>;
};
export const BASE_URL = (
  native?.API_BASE_URL || (__DEV__ ? 'http://10.0.2.2:3000' : '')
).replace(/\/$/, '');
export type Response<T> = {
  data: T;
  meta?: { page: number; limit: number; total: number; hasMore: boolean };
  cachedAt?: string;
};
export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}
function earliestExpiry(value: unknown): number {
  if (!value || typeof value !== 'object') return Infinity;
  let result = Infinity;
  for (const [key, v] of Object.entries(value)) {
    if (key === 'expiresAt' && typeof v === 'string')
      result = Math.min(result, new Date(v).getTime());
    else if (typeof v === 'object')
      result = Math.min(result, earliestExpiry(v));
  }
  return result;
}
export async function api<T>(
  path: string,
  body?: unknown,
  cache = true,
): Promise<Response<T>> {
  if (!BASE_URL)
    throw new ApiError(
      'This build needs a server address. Configure TTD_API_URL when building the app.',
    );
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 18000),
    key = 'ttd:cache:' + BASE_URL + path;
  try {
    const response = await fetch(BASE_URL + '/api/v1' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new ApiError(
        result.error?.fields
          ?.map(
            (f: { path: string; message: string }) => `${f.path}: ${f.message}`,
          )
          .join('\n') ||
          result.error?.message ||
          'Please try again.',
        response.status,
      );
    if (!body && cache)
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          result,
          savedAt: new Date().toISOString(),
          expires: Math.min(Date.now() + 6 * 3600000, earliestExpiry(result)),
        }),
      ).catch(() => {});
    return result;
  } catch (e) {
    if (!body && cache && (!(e instanceof ApiError) || e.status >= 500)) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          if (stored.expires > Date.now())
            return { ...stored.result, cachedAt: stored.savedAt };
          await AsyncStorage.removeItem(key);
        } catch {
          await AsyncStorage.removeItem(key);
        }
      }
    }
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      'We could not reach the server. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }
}
export async function clearCache() {
  const keys = (await AsyncStorage.getAllKeys()).filter(k =>
    k.startsWith('ttd:cache:'),
  );
  await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
}
export function query(
  values: Record<string, string | number | boolean | undefined>,
) {
  return Object.entries(values)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
}
