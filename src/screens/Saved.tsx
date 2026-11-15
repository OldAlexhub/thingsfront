import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bookmark, ArrowUpRight } from 'lucide-react-native';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import {
  AppShell,
  SafeScrollView,
  Header,
  Label,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  spacing,
} from '../components';
export function SavedScreen() {
  const { state, update, view } = useLocal(),
    t = useTheme(),
    nav = useNavigation<any>(),
    [tab, setTab] = useState('Favorites'),
    [name, setName] = useState(''),
    [selected, setSelected] = useState('');
  const tabs = [
    'Favorites',
    'Day plans',
    'Collections',
    'Bucket list',
    'Visited',
    'Recently viewed',
  ];
  const all = [...state.favorites, ...state.bucket, ...state.recent];
  const unique = all.filter(
    (a, i) => all.findIndex(x => x._id === a._id) === i,
  );
  const records =
    tab === 'Favorites'
      ? state.favorites
      : tab === 'Bucket list'
      ? state.bucket
      : tab === 'Visited'
      ? unique.filter(a => state.visited.includes(a._id))
      : tab === 'Collections'
      ? unique.filter(a =>
          state.collections
            .find(c => c.id === selected)
            ?.activityIds.includes(a._id),
        )
      : state.recent;
  function create() {
    if (!name.trim()) return;
    const id = String(Date.now());
    update(old => ({
      ...old,
      collections: [
        ...old.collections,
        { id, name: name.trim().slice(0, 80), activityIds: [] },
      ].slice(0, 100),
    }));
    setName('');
    setSelected(id);
  }
  return (
    <AppShell>
      <SafeScrollView>
        <Header title="Keep the good ideas." kicker="YOUR LITTLE COLLECTION" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22 }}
        >
          {tabs.map(v => (
            <Chip
              title={v}
              key={v}
              selected={tab === v}
              onPress={() => setTab(v)}
            />
          ))}
        </ScrollView>
        <View style={{ padding: 22 }}>
          {tab === 'Day plans' ? (
            state.plans.length ? (
              state.plans.map(p => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.line,
                    borderRadius: 20,
                    padding: 22,
                    marginBottom: 15,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => nav.navigate('Itinerary', { plan: p })}
                  >
                    <View style={spacing.between}>
                      <Bookmark color={t.gold} />
                      <ArrowUpRight color={t.teal} />
                    </View>
                    <Label
                      style={{ fontSize: 22, fontWeight: '800', marginTop: 16 }}
                    >
                      {p.name}
                    </Label>
                    <Label muted style={{ marginTop: 8 }}>
                      {p.stops.length} stops · $
                      {p.knownAdmissionTotal.toFixed(2)} known admission
                    </Label>
                    <Label muted style={{ fontSize: 11, marginTop: 8 }}>
                      Saved plan. Information may have changed.
                    </Label>
                  </Pressable>
                  <Button
                    secondary
                    title="Delete saved day"
                    onPress={() =>
                      Alert.alert(
                        'Delete this day?',
                        'This removes the saved itinerary from this device.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () =>
                              update(old => ({
                                ...old,
                                plans: old.plans.filter(v => v.id !== p.id),
                              })),
                          },
                        ],
                      )
                    }
                  />
                </View>
              ))
            ) : (
              <Empty
                title="Good days belong here."
                message="Plan a day and save it to read the itinerary offline."
                action="Plan my day"
                onAction={() => nav.navigate('Plan')}
              />
            )
          ) : (
            <>
              {tab === 'Collections' && (
                <View>
                  <Field
                    label="New collection"
                    value={name}
                    onChangeText={setName}
                    placeholder="Slow Sundays, places for two…"
                    maxLength={80}
                  />
                  <Button
                    secondary
                    title="Create collection"
                    disabled={!name.trim()}
                    onPress={create}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 20,
                    }}
                  >
                    {state.collections.map(c => (
                      <Chip
                        key={c.id}
                        title={c.name}
                        selected={selected === c.id}
                        onPress={() => setSelected(c.id)}
                      />
                    ))}
                  </View>
                  {selected && (
                    <Button
                      secondary
                      title="Delete this collection"
                      onPress={() =>
                        Alert.alert(
                          'Delete collection?',
                          'Your saved activities will remain.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                update(old => ({
                                  ...old,
                                  collections: old.collections.filter(
                                    c => c.id !== selected,
                                  ),
                                }));
                                setSelected('');
                              },
                            },
                          ],
                        )
                      }
                    />
                  )}
                </View>
              )}
              {records.length ? (
                records.map((a, i) => (
                  <View key={a._id}>
                    <Card
                      activity={a}
                      index={i}
                      onPress={() => {
                        view(a);
                        nav.navigate('Detail', { activity: a });
                      }}
                    />
                    {tab === 'Collections' && (
                      <Button
                        secondary
                        title="Remove from collection"
                        onPress={() =>
                          update(old => ({
                            ...old,
                            collections: old.collections.map(c =>
                              c.id === selected
                                ? {
                                    ...c,
                                    activityIds: c.activityIds.filter(
                                      id => id !== a._id,
                                    ),
                                  }
                                : c,
                            ),
                          }))
                        }
                      />
                    )}
                  </View>
                ))
              ) : (
                <Empty
                  message={
                    tab === 'Collections'
                      ? 'Create a collection, then add experiences from their detail pages.'
                      : 'Save an experience or mark a place as visited, and find it here.'
                  }
                  action="Find something good"
                  onAction={() => nav.navigate('Explore')}
                />
              )}
            </>
          )}
        </View>
      </SafeScrollView>
    </AppShell>
  );
}
