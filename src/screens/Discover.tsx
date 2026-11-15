import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import {
  ChevronDown,
  Search,
  Sparkles,
  Route,
  MapPin,
  Sun,
  ArrowUpRight,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useData, usePlanDefaults } from '../data';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import {
  AppShell,
  SafeScrollView,
  Label,
  Button,
  Card,
  Empty,
  Loading,
  PhotoView,
  SectionHeading,
  Notice,
  spacing,
  Chip,
  openUrl,
} from '../components';
import { SafeAdContainer } from '../ads';
import type { Activity, Home } from '../types';
export function DiscoverScreen() {
  const t = useTheme(),
    nav = useNavigation<any>(),
    {
      city,
      loading: cityLoading,
      error: cityError,
      refresh,
      cachedAt: cityCache,
    } = useData(),
    { state, view } = useLocal(),
    defaults = usePlanDefaults();
  const [home, setHome] = useState<Home>(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [cachedAt, setCachedAt] = useState<string>(),
    [surprising, setSurprising] = useState(false);
  const load = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError('');
    try {
      const result = await api<Home>(`/cities/${city._id}/home`);
      if (
        defaults &&
        result.data.sections.some(s => s.type === 'recommendations')
      ) {
        try {
          const matches = await api<{ activity: Activity }[]>(
            '/recommendations',
            defaults,
            false,
          );
          result.data.sections = result.data.sections.map(s =>
            s.type === 'recommendations'
              ? { ...s, items: matches.data.map(r => r.activity) }
              : s,
          );
        } catch {
          result.data.sections = result.data.sections.map(s =>
            s.type === 'recommendations' ? { ...s, items: [] } : s,
          );
        }
      }
      setHome(result.data);
      setCachedAt(result.cachedAt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [city, defaults]);
  useEffect(() => {
    setHome(undefined);
    void load();
  }, [load]);
  function detail(a: Activity) {
    view(a);
    nav.navigate('Detail', { activity: a });
  }
  async function surprise() {
    if (!defaults) return;
    setSurprising(true);
    try {
      const r = await api<{ activity: Activity }[]>(
        '/recommendations',
        defaults,
        false,
      );
      if (!r.data.length)
        Alert.alert(
          'No matching experiences',
          'Try adjusting your budget, interests or radius in Plan My Day.',
        );
      else
        detail(
          r.data[Math.floor(Math.random() * Math.min(5, r.data.length))]
            .activity,
        );
    } catch (e) {
      Alert.alert('Could not find a match', (e as Error).message);
    } finally {
      setSurprising(false);
    }
  }
  if (cityLoading && !city)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  if (!city)
    return (
      <AppShell>
        <Empty
          title={cityError ? 'A quick pause.' : 'Your next city is on its way.'}
          message={
            cityError ||
            'Published destinations will appear here as soon as they are available.'
          }
          action="Try again"
          onAction={() => void refresh()}
        />
      </AppShell>
    );
  return (
    <AppShell>
      <SafeScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={t.teal}
          />
        }
      >
        <View
          style={[
            spacing.between,
            { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose city"
            onPress={() => nav.navigate('CityPicker')}
            style={spacing.row}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 40, height: 44 }}
            />
            <View>
              <Label style={[spacing.eyebrow, { color: t.muted, fontSize: 8 }]}>
                YOUR NEXT GOOD DAY
              </Label>
              <View style={spacing.row}>
                <Label style={{ fontWeight: '800', fontSize: 17 }}>
                  {city.name}, {city.state}
                </Label>
                <ChevronDown color={t.teal} size={17} />
              </View>
            </View>
          </Pressable>
          <Sun size={22} color={t.gold} />
        </View>
        <PhotoView
          photo={city.heroImage}
          decorative
          style={{ height: 430, marginHorizontal: 14, borderRadius: 28 }}
        >
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#10182755',
            }}
          />
          <View
            style={{ position: 'absolute', left: 24, right: 24, bottom: 28 }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#101827b8',
                borderRadius: 20,
                paddingHorizontal: 13,
                paddingVertical: 6,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: '#FFB454',
                  fontSize: 10,
                  letterSpacing: 2,
                  fontWeight: '700',
                }}
              >
                GO SOMEWHERE. FEEL SOMETHING.
              </Text>
            </View>
            <Text
              style={{
                color: '#fff',
                fontSize: 46,
                fontWeight: '800',
                lineHeight: 50,
                letterSpacing: -1.8,
              }}
            >
              A day less{'\n'}ordinary.
            </Text>
            <Text
              style={{
                color: '#F8F6F0',
                fontSize: 15,
                lineHeight: 23,
                marginTop: 13,
                marginBottom: 24,
              }}
            >
              Find your kind of adventure in {city.name}.
            </Text>
            <Button
              title="Let's plan your day"
              onPress={() => nav.navigate('Plan')}
              icon={<Route size={18} color="#fff" />}
            />
          </View>
        </PhotoView>
        {city.heroImage?.credit && (
          <Pressable
            accessibilityRole="link"
            onPress={() => openUrl(city.heroImage?.sourceUrl)}
          >
            <Label
              muted
              style={{ fontSize: 9, marginHorizontal: 24, marginTop: 5 }}
            >
              Photo: {city.heroImage.credit} · {city.heroImage.license} · Photo
              &amp; license details
            </Label>
          </Pressable>
        )}
        <SafeAdContainer />
        <View style={{ paddingHorizontal: 22, marginTop: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search experiences"
            onPress={() => nav.navigate('Explore')}
            style={[
              spacing.row,
              {
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: 17,
                padding: 18,
              },
            ]}
          >
            <Search size={19} color={t.teal} />
            <Label muted>What are you in the mood for?</Label>
          </Pressable>
          <View style={[spacing.row, { marginTop: 14 }]}>
            <Button
              style={{ flex: 1 }}
              secondary
              title={surprising ? 'Finding a match…' : 'Surprise me'}
              disabled={surprising}
              icon={<Sparkles color={t.gold} size={17} />}
              onPress={surprise}
            />
            <Button
              style={{ flex: 1 }}
              secondary
              title="Explore the map"
              icon={<MapPin color={t.teal} size={17} />}
              onPress={() => nav.navigate('Explore', { map: true })}
            />
          </View>
          {(cachedAt || cityCache) && (
            <Notice>
              Offline content, saved{' '}
              {new Date(cachedAt || cityCache!).toLocaleString()}. Details may
              have changed.
            </Notice>
          )}
          {error && <Notice>{error}</Notice>}
        </View>
        <View style={spacing.section}>
          <Label style={[spacing.eyebrow, { color: t.gold, marginBottom: 7 }]}>
            MAKE IT YOURS
          </Label>
          <Label
            style={{ fontSize: 25, fontWeight: '800', letterSpacing: -0.7 }}
          >
            Good to see you, explorer.
          </Label>
          <Label muted style={{ marginTop: 6 }}>
            {state.mode === 'local'
              ? 'A fresh perspective on the place you call home.'
              : 'Make the most of your time here.'}
          </Label>
        </View>
        <CategoryRail
          onSelect={category => nav.navigate('Explore', { category })}
        />
        {loading && !home ? (
          <Loading />
        ) : (
          home?.sections.map(s => (
            <View key={s.key} style={spacing.section}>
              <SectionHeading
                title={s.title}
                onPress={() =>
                  nav.navigate('Explore', { events: s.type === 'events' })
                }
              />
              {s.items.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14 }}
                >
                  {s.items.map((a, i) => (
                    <Card
                      activity={a}
                      key={a._id}
                      wide
                      index={i}
                      onPress={() => detail(a)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: 20,
                    padding: 23,
                  }}
                >
                  <Label muted>
                    New experiences are being added. Check back soon or explore
                    another category.
                  </Label>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ padding: 24, alignItems: 'center', gap: 5 }}>
          <Label style={[spacing.eyebrow, { color: t.teal }]}>
            DISCOVER. EXPLORE. EXPERIENCE.
          </Label>
          <Label muted style={{ fontSize: 11 }}>
            Thoughtfully made by Old Alex Hub
          </Label>
        </View>
      </SafeScrollView>
    </AppShell>
  );
}
function CategoryRail({ onSelect }: { onSelect: (id: string) => void }) {
  const { categories } = useData();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20 }}
    >
      {categories
        .filter(c => !c.parentId)
        .map(c => (
          <Chip key={c._id} title={c.name} onPress={() => onSelect(c._id)} />
        ))}
    </ScrollView>
  );
}
export function CityPickerScreen() {
  const { cities, city, loading, error, refresh } = useData(),
    { patch } = useLocal(),
    nav = useNavigation<any>(),
    t = useTheme();
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  return (
    <AppShell>
      <SafeScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={t.teal}
          />
        }
      >
        <View style={{ padding: 24 }}>
          <Button title="Back" secondary onPress={() => nav.goBack()} />
          <Label style={[spacing.title, { marginTop: 24 }]}>
            Where will today take you?
          </Label>
          <Label muted style={{ marginTop: 12, marginBottom: 24 }}>
            Your next adventure starts with a place.
          </Label>
          {loading ? (
            <Loading />
          ) : (
            cities.map(c => (
              <Pressable
                key={c._id}
                accessibilityRole="button"
                onPress={() => {
                  patch({ cityId: c._id });
                  nav.goBack();
                }}
                style={{
                  marginBottom: 18,
                  borderRadius: 22,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: city?._id === c._id ? t.teal : t.line,
                }}
              >
                <PhotoView photo={c.heroImage} style={{ height: 180 }} />
                <View style={{ padding: 20, backgroundColor: t.surface }}>
                  <Label style={{ fontSize: 24, fontWeight: '800' }}>
                    {c.name} <ArrowUpRight size={20} color={t.teal} />
                  </Label>
                  <Label muted>
                    {c.state}, {c.country}
                  </Label>
                  <Label muted style={{ fontSize: 13, marginTop: 10 }}>
                    {c.description}
                  </Label>
                </View>
              </Pressable>
            ))
          )}
          {!cities.length && !loading && (
            <Empty
              message={error || 'No destinations have been published yet.'}
              action="Try again"
              onAction={() => void refresh()}
            />
          )}
        </View>
      </SafeScrollView>
    </AppShell>
  );
}
