import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { api } from './api';
import type { City, Category, PlanInput } from './types';
import { useLocal } from './storage';
const Context = createContext<{
  cities: City[];
  city?: City;
  categories: Category[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  cachedAt?: string;
}>({
  cities: [],
  categories: [],
  loading: true,
  error: '',
  refresh: async () => {},
});
export function DataProvider({ children }: { children: React.ReactNode }) {
  const { state, patch, ready } = useLocal(),
    [cities, setCities] = useState<City[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [cachedAt, setCachedAt] = useState<string>();
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api<City[]>('/cities');
      setCities(result.data);
      setCachedAt(result.cachedAt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (ready) void refresh();
  }, [refresh, ready]);
  useEffect(() => {
    if (cities.length && !cities.some(c => c._id === state.cityId))
      patch({ cityId: cities[0]._id });
  }, [cities, state.cityId, patch]);
  const city = cities.find(c => c._id === state.cityId);
  useEffect(() => {
    let alive = true;
    setCategories([]);
    if (city)
      api<Category[]>('/categories?cityId=' + city._id)
        .then(r => {
          if (alive) setCategories(r.data);
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, [city]);
  return (
    <Context.Provider
      value={{ cities, city, categories, loading, error, refresh, cachedAt }}
    >
      {children}
    </Context.Provider>
  );
}
export function useData() {
  return useContext(Context);
}
export function localDate(timezone?: string) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day']
    .map(k => p.find(x => x.type === k)?.value)
    .join('-');
}
export function usePlanDefaults(): PlanInput | undefined {
  const { state } = useLocal(),
    { city } = useData();
  return useMemo(
    () =>
      city
        ? {
            cityId: city._id,
            date: localDate(city.timezone),
            startTime: '09:00',
            endTime: '18:00',
            budget: state.budget,
            strictBudget: true,
            adults: state.adults,
            childAges: state.childAges,
            start: [city.longitude, city.latitude],
            transport: 'driving',
            interests: state.interests,
            environment: 'any',
            pace: 'balanced',
            meals: true,
            radiusKm: 30,
            mode: state.mode,
            visited: state.visited,
            exclude: [],
          }
        : undefined,
    [
      city,
      state.budget,
      state.adults,
      state.childAges,
      state.interests,
      state.mode,
      state.visited,
    ],
  );
}
