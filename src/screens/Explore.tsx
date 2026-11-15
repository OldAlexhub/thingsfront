import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import { SlidersHorizontal, Map, LocateFixed, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, query, native } from '../api';
import { useData } from '../data';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import {
  AppShell,
  Header,
  Field,
  Button,
  Chip,
  Label,
  Card,
  Empty,
  Loading,
  Notice,
  SafeScrollView,
  spacing,
} from '../components';
import { SafeAdContainer } from '../ads';
import { fromKilometers, toKilometers } from '../units';
import { ExperienceMap } from './Map';
import type { Activity } from '../types';
export async function currentLocation() {
  const permission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    {
      title: 'Find experiences nearby',
      message:
        'Things to Do uses your approximate location only when you request it. You can also choose a starting point manually.',
      buttonPositive: 'Continue',
      buttonNegative: 'Not now',
    },
  );
  if (permission !== PermissionsAndroid.RESULTS.GRANTED)
    throw new Error(
      'Location permission was not granted. You can enter a starting point manually.',
    );
  return native.getLocation();
}
export function ExploreScreen() {
  const t = useTheme(),
    nav = useNavigation<any>(),
    route = useRoute<any>(),
    { city, categories } = useData(),
    { view, update, state } = useLocal();
  const [search, setSearch] = useState(''),
    [debounced, setDebounced] = useState(''),
    [category, setCategory] = useState(''),
    [items, setItems] = useState<Activity[]>([]),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [cached, setCached] = useState<string>(),
    [filterOpen, setFilterOpen] = useState(false),
    [map, setMap] = useState(false),
    [events, setEvents] = useState(false),
    [hotels, setHotels] = useState(false),
    [filters, setFilters] = useState({
      budget: '',
      duration: '',
      environment: '',
      family: false,
      age: '',
      sort: 'relevance',
      radius: '30',
      lat: '',
      lon: '',
      openNow: false,
      from: '',
      to: '',
    }),
    [version, setVersion] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (route.params?.category !== undefined)
      setCategory(route.params.category);
    if (route.params?.events !== undefined) { setEvents(route.params.events); setHotels(false); }
    if (route.params?.hotels !== undefined) {
      setHotels(route.params.hotels);
      if (route.params.hotels) {
        setEvents(false);
        setFilters(old=>({...old,budget:'',duration:'',environment:'',family:false,age:'',openNow:false,sort:'relevance'}));
      }
    }
    if (route.params?.map !== undefined) setMap(route.params.map);
    setPage(1);
  }, [route.params]);
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [city?._id, events, hotels]);
  useEffect(() => {
    if (!city) return;
    const seq = ++request.current;
    let active = true;
    setLoading(true);
    setError('');
    const params = query({
      cityId: city._id,
      kind: !events && !hotels && categories.find(c=>c._id === category)?.slug !== 'hotels' ? 'place' : undefined,
      q: debounced,
      category: category || undefined,
      page,
      limit: 20,
      budget: filters.budget || undefined,
      duration: filters.duration || undefined,
      environment: filters.environment || undefined,
      family: filters.family ? 'true' : undefined,
      age: filters.age || undefined,
      sort: filters.sort,
      radiusKm: filters.radius,
      lat: filters.lat || undefined,
      lon: filters.lon || undefined,
      openNow: filters.openNow ? 'true' : undefined,
      from: events && filters.from ? filters.from + 'T00:00:00Z' : undefined,
      to: events && filters.to ? filters.to + 'T23:59:59Z' : undefined,
    });
    api<Activity[]>('/' + (events ? 'events' : hotels ? 'hotels' : 'activities') + '?' + params)
      .then(result => {
        if (!active || seq !== request.current) return;
        setItems(old =>
          page === 1
            ? result.data
            : [
                ...old,
                ...result.data.filter(a => !old.some(o => o._id === a._id)),
              ],
        );
        setMore(!!result.meta?.hasMore);
        setCached(result.cachedAt);
      })
      .catch(e => {
        if (active && seq === request.current) setError(e.message);
      })
      .finally(() => {
        if (active && seq === request.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [city, debounced, category, page, filters, events, hotels, version, categories]);
  function open(a: Activity) {
    if (search.trim())
      update(old => ({
        ...old,
        recentSearches: [
          search.trim(),
          ...old.recentSearches.filter(v => v !== search.trim()),
        ].slice(0, 15),
      }));
    view(a);
    nav.navigate('Detail', { activity: a });
  }
  function filter(key: keyof typeof filters, value: string | boolean) {
    setFilters(old => ({ ...old, [key]: value }));
    setPage(1);
  }
  if (!city)
    return (
      <AppShell>
        <Empty
          message="Choose a published destination to explore experiences."
          action="Choose a city"
          onAction={() => nav.navigate('CityPicker')}
        />
      </AppShell>
    );
  const header = (
    <>
      <Header
        title="Follow your curiosity."
        kicker={`EXPLORE ${city.name.toUpperCase()}`}
        action={
          <Pressable
            accessibilityLabel="Search filters"
            accessibilityRole="button"
            onPress={() => setFilterOpen(true)}
            style={{
              padding: 12,
              backgroundColor: t.surface,
              borderRadius: 15,
            }}
          >
            <SlidersHorizontal color={t.teal} />
          </Pressable>
        }
      />
      <View style={{ paddingHorizontal: 22 }}>
        <Field
          label={hotels ? 'Find a place to stay' : events ? 'Find an event' : 'Find an experience'}
          value={search}
          onChangeText={setSearch}
          placeholder={hotels ? 'Search hotels and places to stay…' : events ? 'Search upcoming events…' : 'Parks, food, art, a little adventure…'}
          returnKeyType="search"
        />
        <View style={spacing.between}>
          <View style={{ flexDirection: 'row' }}>
            <Chip
              title="Places"
              selected={!events && !hotels}
              onPress={() => {
                setEvents(false);
                setHotels(false); setCategory('');
                setPage(1);
              }}
            />
            <Chip
              title="Events"
              selected={events}
              onPress={() => {
                setEvents(true);
                setHotels(false); setCategory('');
                setPage(1);
              }}
            />
            <Chip title="Hotels" selected={hotels} onPress={() => {
              setHotels(true); setEvents(false); setCategory(''); setPage(1);
              setFilters(old=>({...old,budget:'',duration:'',environment:'',family:false,age:'',openNow:false,sort:'relevance'}));
            }} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={map ? 'Show list' : 'Show map'}
            onPress={() => setMap(!map)}
            style={spacing.row}
          >
            <Map color={t.teal} size={18} />
            <Label style={{ fontSize: 12, color: t.teal }}>
              {map ? 'List' : 'Map'}
            </Label>
          </Pressable>
        </View>
        {!hotels && !events && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
        >
          <Chip
            title="All interests"
            selected={!category}
            onPress={() => {
              setCategory('');
              setPage(1);
            }}
          />
          {categories.map(c => (
            <Chip
              key={c._id}
              title={c.name}
              selected={category === c._id}
              onPress={() => {
                setCategory(c._id);
                setPage(1);
              }}
            />
          ))}
        </ScrollView>}
        {cached && (
          <Notice>
            Offline results saved {new Date(cached).toLocaleString()}.
          </Notice>
        )}
        {error && <Notice>{error}</Notice>}
      </View>
    </>
  );
  return (
    <AppShell>
      {map && header}
      {map ? (
        <View style={{ flex: 1 }}>
          <ExperienceMap activities={items} onSelect={open} />
          <View style={{ padding: 12 }}>
            <Label muted style={{ fontSize: 11 }}>
              Showing {items.length} loaded experiences.{' '}
              {more ? 'Load more to see additional markers.' : ''}
            </Label>
            {more && (
              <Button
                secondary
                title="Load more places"
                disabled={loading}
                onPress={() => setPage(p => p + 1)}
              />
            )}
          </View>
        </View>
      ) : (
        <FlatList
          removeClippedSubviews={false}
          data={items}
          keyExtractor={a => a._id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item, index }) => (
            <View style={{ marginHorizontal: 22 }}>
              <Card activity={item} index={index} onPress={() => open(item)} />
              {index === Math.min(1, items.length - 1) && <SafeAdContainer />}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading && page === 1}
              onRefresh={() => {
                setPage(1);
                setVersion(v => v + 1);
              }}
              tintColor={t.teal}
            />
          }
          ListEmptyComponent={
            loading ? (
              <Loading />
            ) : (
              <Empty
                message={
                  error ||
                  (events ? 'No upcoming events match here yet. Calendar coverage varies by city; try another date or reset your filters.' : 'No matches yet. Try another category or loosen your filters.')
                }
                action={error ? 'Try again' : 'Reset filters'}
                onAction={() => {
                  setCategory('');
                  setSearch('');
                  setPage(1);
                  setVersion(v => v + 1);
                  setFilters({
                    budget: '',
                    duration: '',
                    environment: '',
                    family: false,
                    age: '',
                    sort: 'relevance',
                    radius: '30',
                    lat: '',
                    lon: '',
                    openNow: false,
                    from: '',
                    to: '',
                  });
                }}
              />
            )
          }
          ListFooterComponent={
            <View style={{ paddingHorizontal: 22 }}>
              {more && (
                <Button
                  title={loading ? 'Loading…' : 'Explore more'}
                  secondary
                  disabled={loading}
                  onPress={() => setPage(p => p + 1)}
                />
              )}
            </View>
          }
        />
      )}
      <Modal
        visible={filterOpen}
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <AppShell>
          <Header
            title="Find your kind of day."
            kicker="FILTERS"
            action={
              <Pressable
                accessibilityLabel="Close filters"
                onPress={() => setFilterOpen(false)}
                style={{ padding: 12 }}
              >
                <X color={t.text} />
              </Pressable>
            }
          />
          <SafeScrollView contentContainerStyle={{ padding: 22 }}>
            <Label muted>
              {hotels ? 'Find a property by name or location. Check the hotel for nightly rates, room availability and amenities.' : 'Price filters use known listed adult admission. Group and meal costs can differ.'}
            </Label>
            {!hotels && <>
            <View style={[spacing.row, { marginTop: 18 }]}>
              <Field
                label="Maximum admission ($)"
                value={filters.budget}
                onChangeText={v => filter('budget', v)}
                keyboardType="numeric"
                placeholder="Any"
              />
              <Field
                label="Maximum duration (min)"
                value={filters.duration}
                onChangeText={v => filter('duration', v)}
                keyboardType="numeric"
                placeholder="Any"
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {['', 'indoor', 'outdoor'].map(v => (
                <Chip
                  key={v}
                  title={v || 'Any setting'}
                  selected={filters.environment === v}
                  onPress={() => filter('environment', v)}
                />
              ))}
            </View>
            <View style={[spacing.between, { marginBottom: 18 }]}>
              <Label>Family suitable</Label>
              <Switch
                accessibilityLabel="Family suitable"
                value={filters.family}
                onValueChange={v => filter('family', v)}
              />
            </View>
            <Field
              label="Participant age"
              value={filters.age}
              onChangeText={v => filter('age', v)}
              keyboardType="numeric"
              placeholder="Any"
            />
            <View style={[spacing.between, { marginBottom: 18 }]}>
              <Label>Verified open now</Label>
              <Switch
                accessibilityLabel="Verified open now"
                value={filters.openNow}
                onValueChange={v => filter('openNow', v)}
              />
            </View>
            <Label muted>
              Unknown and expired hours are excluded when this is on.
            </Label>
            </>}
            <View style={{ height: 20 }} />
            <Button
              secondary
              title="Use my approximate location"
              icon={<LocateFixed color={t.teal} size={18} />}
              onPress={() =>
                currentLocation()
                  .then(p => {
                    setFilters(old => ({
                      ...old,
                      lat: String(p.latitude),
                      lon: String(p.longitude),
                    }));
                    setPage(1);
                  })
                  .catch(e => Alert.alert('Location unavailable', e.message))
              }
            />
            <View style={[spacing.row, { marginTop: 18 }]}>
              <Field
                label="Latitude"
                value={filters.lat}
                onChangeText={v => filter('lat', v)}
                keyboardType="numbers-and-punctuation"
              />
              <Field
                label="Longitude"
                value={filters.lon}
                onChangeText={v => filter('lon', v)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Field
              label={`Search radius (${state.distanceUnit})`}
              value={
                filters.radius
                  ? String(
                      Math.round(
                        fromKilometers(
                          Number(filters.radius),
                          state.distanceUnit,
                        ) * 10,
                      ) / 10,
                    )
                  : ''
              }
              onChangeText={v =>
                filter(
                  'radius',
                  v ? String(toKilometers(Number(v), state.distanceUnit)) : '',
                )
              }
              keyboardType="numeric"
            />
            <Label muted>Sort experiences</Label>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}
            >
              {(hotels ? ['relevance','distance','title'] : ['relevance', 'distance', 'title', 'price']).map(v => (
                <Chip
                  key={v}
                  title={v}
                  selected={filters.sort === v}
                  onPress={() => filter('sort', v)}
                />
              ))}
            </View>
            {events && (
              <>
                <Field
                  label="From date (YYYY-MM-DD, UTC)"
                  value={filters.from}
                  onChangeText={v => filter('from', v)}
                  placeholder="2026-11-14"
                />
                <Field
                  label="To date (YYYY-MM-DD, UTC)"
                  value={filters.to}
                  onChangeText={v => filter('to', v)}
                  placeholder="2026-11-15"
                />
              </>
            )}
            <Button
              title="Show matching experiences"
              onPress={() => setFilterOpen(false)}
            />
          </SafeScrollView>
        </AppShell>
      </Modal>
    </AppShell>
  );
}
