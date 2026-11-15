import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState } from 'react-native';
import type { Activity, Plan } from './types';
import type { Visit } from './memories';
export type LocalState = {
  cityId: string;
  mode: 'local' | 'tourist';
  budget: number;
  adults: number;
  childAges: number[];
  interests: string[];
  theme: 'system' | 'dark' | 'light';
  distanceUnit: 'mi' | 'km';
  favorites: Activity[];
  bucket: Activity[];
  visited: string[];
  visits: Visit[];
  recent: Activity[];
  recentSearches: string[];
  collections: { id: string; name: string; activityIds: string[] }[];
  plans: Plan[];
  ageConfirmed: boolean;
};
export const initialState: LocalState = {
  cityId: '',
  mode: 'tourist',
  budget: 100,
  adults: 1,
  childAges: [],
  interests: [],
  theme: 'system',
  distanceUnit: 'mi',
  favorites: [],
  bucket: [],
  visited: [],
  visits: [],
  recent: [],
  recentSearches: [],
  collections: [],
  plans: [],
  ageConfirmed: false,
};
const KEY = 'ttd:personal:v1';
export function retainedActivity(a: Activity): Activity {
  if (a.expiresAt && new Date(a.expiresAt).getTime() <= Date.now())
    return {
      _id: a._id,
      cityId: a.cityId,
      title: 'Experience information expired',
      categories: [],
      tags: [],
      audience: [],
      images: [],
      source: a.source,
      unavailable: true,
      expiresAt: a.expiresAt,
    };
  return a;
}
export function normalizeState(raw: Partial<LocalState>): LocalState {
  const state = { ...initialState, ...raw };
  state.distanceUnit = raw.distanceUnit === 'km' ? 'km' : 'mi';
  for (const key of ['favorites', 'bucket', 'recent'] as const)
    state[key] = (Array.isArray(raw[key]) ? raw[key]! : [])
      .filter(a => a && typeof a._id === 'string')
      .map(retainedActivity)
      .slice(0, key === 'recent' ? 30 : 500);
  state.plans = (Array.isArray(raw.plans) ? raw.plans : [])
    .filter(p => p && Array.isArray(p.stops))
    .slice(0, 100)
    .map(p => ({
      ...p,
      stops: p.stops.map(s => ({
        ...s,
        activity: retainedActivity(s.activity),
      })),
    }));
  for (const key of [
    'visited',
    'interests',
    'recentSearches',
    'childAges',
    'collections',
  ] as const)
    if (!Array.isArray(state[key])) (state as any)[key] = initialState[key];
  const previous = Array.isArray(raw.visits) ? raw.visits : [];
  const snapshots = [...state.favorites, ...state.bucket, ...state.recent, ...state.plans.flatMap(p=>p.stops.map(s=>s.activity))];
  state.visits = previous.filter(v=>v && typeof v.activityId === 'string' && v.activity && state.visited.includes(v.activityId))
    .map(v=>({...v,activity:retainedActivity(v.activity)})).slice(0,500);
  for (const activityId of state.visited) {
    const activity=snapshots.find(a=>a._id===activityId && !a.unavailable);
    if (activity && !state.visits.some(v=>v.activityId===activityId)) state.visits.push({activityId,activity,placeTitle:activity.title,cityName:'',visitedOn:'',name:'',note:''});
  }
  return state;
}
type Store = {
  state: LocalState;
  ready: boolean;
  update: (fn: (old: LocalState) => LocalState) => void;
  patch: (value: Partial<LocalState>) => void;
  toggleSave: (a: Activity, bucket?: boolean) => void;
  view: (a: Activity) => void;
  savePlan: (p: Plan) => void;
  clear: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function LocalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (raw)
          try {
            setState(normalizeState(JSON.parse(raw)));
          } catch {
            Alert.alert(
              'Saved data could not be read',
              'Your preferences have been reset.',
            );
          }
      })
      .catch(() =>
        Alert.alert(
          'Storage unavailable',
          'Your changes may not be saved on this device.',
        ),
      )
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) {
      queue.current = queue.current
        .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
        .catch(() => {
          Alert.alert('Could not save', 'Your device may be low on storage.');
        });
    }
  }, [state, ready]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', value => {
      if (value === 'active') setState(old => normalizeState(old));
    });
    return () => subscription.remove();
  }, []);
  const update = useCallback(
    (fn: (old: LocalState) => LocalState) =>
      setState(old => normalizeState(fn(old))),
    [],
  );
  const patch = useCallback(
    (value: Partial<LocalState>) => update(old => ({ ...old, ...value })),
    [update],
  );
  const toggleSave = useCallback(
    (a: Activity, bucket = false) =>
      update(old => {
        const key = bucket ? 'bucket' : 'favorites';
        return {
          ...old,
          [key]: old[key].some(x => x._id === a._id)
            ? old[key].filter(x => x._id !== a._id)
            : [a, ...old[key]].slice(0, 500),
        };
      }),
    [update],
  );
  const view = useCallback(
    (a: Activity) =>
      update(old => ({
        ...old,
        recent: [a, ...old.recent.filter(v => v._id !== a._id)].slice(0, 30),
      })),
    [update],
  );
  const savePlan = useCallback(
    (p: Plan) =>
      update(old => ({
        ...old,
        plans: [
          {
            ...p,
            id: p.id || String(Date.now()),
            name: p.name || `${p.cityName} · ${p.date}`,
          },
          ...old.plans.filter(v => !p.id || v.id !== p.id),
        ].slice(0, 100),
      })),
    [update],
  );
  const clear = useCallback(async () => {
    await queue.current;
    await AsyncStorage.removeItem(KEY);
    setState(initialState);
  }, []);
  return (
    <Context.Provider
      value={{ state, ready, update, patch, toggleSave, view, savePlan, clear }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLocal() {
  const value = useContext(Context);
  if (!value) throw new Error('LocalProvider missing');
  return value;
}
