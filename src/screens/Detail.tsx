import React, { useEffect, useState } from 'react';
import { View, Modal, Pressable, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Heart,
  Navigation,
  Check,
  ArrowUpRight,
  X,
  Bookmark,
} from 'lucide-react-native';
import { api } from '../api';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import { useAds } from '../ads';
import {
  AppShell,
  SafeScrollView,
  Header,
  PhotoView,
  Label,
  Button,
  Notice,
  Empty,
  spacing,
  openUrl,
} from '../components';
import type { Activity } from '../types';
export function DetailScreen() {
  const route = useRoute<any>(),
    nav = useNavigation<any>(),
    t = useTheme(),
    { state, toggleSave, update, view } = useLocal(),
    ads = useAds(),
    [a, setActivity] = useState<Activity>(route.params.activity),
    [notice, setNotice] = useState(''),
    [unavailable, setUnavailable] = useState(
      !!route.params.activity.unavailable,
    ),
    [gallery, setGallery] = useState(false),
    [collectionPicker, setCollectionPicker] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const item = route.params.activity as Activity;
    setActivity(item);
    setUnavailable(!!item.unavailable);
    setNotice('');
    api<Activity>(`/${item.startAt ? 'events' : 'activities'}/${item._id}`)
      .then(r => {
        if (alive) {
          setActivity(r.data);
          setUnavailable(false);
          view(r.data);
          if (r.cachedAt)
            setNotice(
              'Showing cached information. Confirm details with the venue.',
            );
        }
      })
      .catch(e => {
        if (alive) {
          if (e.status === 404) setUnavailable(true);
          setNotice(
            e.status === 404
              ? 'This experience is no longer published.'
              : e.message,
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [route.params.activity, retry, view]);
  const saved = state.favorites.some(x => x._id === a._id),
    visited = state.visited.includes(a._id),
    bucket = state.bucket.some(x => x._id === a._id);
  if (unavailable)
    return (
      <AppShell>
        <Header back title="Plans change." />
        <Empty
          message={
            notice ||
            'This saved information has expired. Check again when online.'
          }
          action="Check again"
          onAction={() => setRetry(v => v + 1)}
        />
        <View style={{ padding: 22 }}>
          <Button
            secondary
            title="Remove from saved"
            onPress={() => {
              if (saved) toggleSave(a);
              if (bucket) toggleSave(a, true);
              nav.goBack();
            }}
          />
        </View>
      </AppShell>
    );
  return (
    <AppShell>
      <SafeScrollView>
        <Header
          back
          title={a.title}
          kicker={a.startAt ? 'WHAT’S HAPPENING' : 'MAKE A MEMORY'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open photo gallery"
          onPress={() => {
            if (a.images?.length) setGallery(true);
          }}
        >
          <PhotoView
            photo={a.images?.[0]}
            activity={a}
            style={{
              height: a.images?.length ? 260 : 160,
              marginHorizontal: 18,
              borderRadius: 24,
            }}
          />
        </Pressable>
        <View style={{ padding: 22 }}>
          {a.images?.[0]?.credit && (
            <Label muted style={{ fontSize: 10 }}>
              {a.images[0].credit} · {a.images[0].license}
            </Label>
          )}
          {notice && <Notice>{notice}</Notice>}
          <View style={[spacing.row, { marginVertical: 18 }]}>
            <Button
              style={{ flex: 1 }}
              title={saved ? 'Saved' : 'Save experience'}
              secondary
              icon={
                <Heart
                  size={18}
                  color={saved ? t.gold : t.teal}
                  fill={saved ? t.gold : 'transparent'}
                />
              }
              onPress={() => toggleSave(a)}
            />
            <Button
              style={{ flex: 1 }}
              title="Share"
              secondary
              onPress={() =>
                Share.share({
                  message: [
                    a.title,
                    a.shortDescription,
                    a.officialWebsite || a.sourceUrl,
                    'Discover with Things to Do by Old Alex Hub',
                  ]
                    .filter(Boolean)
                    .join('\n'),
                }).catch(() =>
                  Alert.alert('Share unavailable', 'Please try again.'),
                )
              }
            />
          </View>
          <Label style={{ fontSize: 25, fontWeight: '800', marginBottom: 12 }}>
            A little more about it.
          </Label>
          <Label muted>
            {a.description ||
              a.shortDescription ||
              'See the official venue for more details.'}
          </Label>
          <View style={{ flexDirection: 'row', gap: 14, marginVertical: 24 }}>
            <View
              style={{
                flex: 1,
                padding: 17,
                borderRadius: 18,
                backgroundColor: t.surface,
              }}
            >
              <Label muted style={{ fontSize: 10 }}>
                ADMISSION
              </Label>
              <Label
                style={{ fontSize: 24, fontWeight: '800', marginVertical: 8 }}
              >
                {a.priceInformation?.known
                  ? a.priceInformation.adult === 0
                    ? 'Free'
                    : `$${a.priceInformation.adult}`
                  : 'Check venue'}
              </Label>
              <Label muted style={{ fontSize: 11 }}>
                {a.priceInformation?.perGroup
                  ? 'Per group'
                  : 'Listed adult admission'}
              </Label>
            </View>
            <View
              style={{
                flex: 1,
                padding: 17,
                borderRadius: 18,
                backgroundColor: t.surface,
              }}
            >
              <Label muted style={{ fontSize: 10 }}>
                TAKE YOUR TIME
              </Label>
              <Label
                style={{ fontSize: 22, fontWeight: '800', marginVertical: 8 }}
              >
                {a.estimatedDuration
                  ? `${a.estimatedDuration.min}–${a.estimatedDuration.max}`
                  : 'Varies'}
              </Label>
              <Label muted style={{ fontSize: 11 }}>
                {a.estimatedDuration
                  ? 'Estimated minutes'
                  : 'Plan your own pace'}
              </Label>
            </View>
          </View>
          {!a.priceInformation?.known &&
            (a.bookingUrl || a.officialWebsite) && (
              <Button
                secondary
                title="Check current prices"
                onPress={() => openUrl(a.bookingUrl || a.officialWebsite)}
              />
            )}
          {a.priceInformation?.note && (
            <Label muted>{a.priceInformation.note}</Label>
          )}
          {a.startAt && (
            <Notice>
              {new Date(a.startAt).toLocaleString('en-US', {
                timeZone: a.timezone,
              })}{' '}
              · {a.timezone} · {a.eventStatus}
              {a.venue ? ' · ' + a.venue : ''}
            </Notice>
          )}
          {a.reservationRequired && (
            <Notice>
              Reservation required. Confirm a place before you travel.
            </Notice>
          )}
          <Label
            style={{
              fontSize: 22,
              fontWeight: '800',
              marginTop: 25,
              marginBottom: 10,
            }}
          >
            Good to know
          </Label>
          {a.environment && a.environment !== 'unknown' && (
            <Label muted>Setting: {a.environment}</Label>
          )}
          <Label muted>
            Accessibility:{' '}
            {a.accessibility || 'Not verified. Contact the venue.'}
          </Label>
          <Label muted>Parking: {a.parking || 'Not verified.'}</Label>
          {a.operatingHours?.verified &&
          new Date(a.operatingHours.validUntil) > new Date() ? (
            <View style={{ marginTop: 14 }}>
              <Label>Reported hours ({a.operatingHours.timezone})</Label>
              {a.operatingHours.weekly.map((h, i) => (
                <Label key={i} muted>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][h.day]} ·{' '}
                  {h.open}–{h.close}
                </Label>
              ))}
            </View>
          ) : (
            <Notice>
              Opening hours are unknown or no longer verified. Check before you
              go.
            </Notice>
          )}
          <Label
            style={{
              fontSize: 22,
              fontWeight: '800',
              marginTop: 24,
              marginBottom: 10,
            }}
          >
            Find your way there
          </Label>
          <Label muted>
            {a.location?.address || 'See the map for the listed location.'}
          </Label>
          {a.coordinates && (
            <View style={[spacing.row, { marginTop: 16 }]}>
              <Button
                style={{ flex: 1 }}
                title="Directions"
                icon={<Navigation size={17} color="#fff" />}
                onPress={() =>
                  openUrl(
                    `https://www.google.com/maps/dir/?api=1&destination=${
                      a.coordinates!.coordinates[1]
                    },${a.coordinates!.coordinates[0]}`,
                  )
                }
              />
              <Button
                style={{ flex: 1 }}
                secondary
                title="Show map"
                onPress={() =>
                  nav.navigate('Map', { activities: [a], title: a.title })
                }
              />
            </View>
          )}
          {(a.bookingUrl || a.officialWebsite) && (
            <View style={{ marginTop: 14 }}>
              <Button
                secondary
                title={
                  a.bookingUrl
                    ? 'Check tickets & availability'
                    : 'Visit official website'
                }
                icon={<ArrowUpRight size={18} color={t.teal} />}
                onPress={() => openUrl(a.bookingUrl || a.officialWebsite)}
              />
            </View>
          )}
          <View style={{ marginTop: 25, gap: 12 }}>
            <Button
              secondary
              title={visited ? 'Visited ✓' : 'Mark as visited'}
              icon={<Check color={t.teal} size={18} />}
              onPress={() => {
                update(old => ({
                  ...old,
                  visited: visited
                    ? old.visited.filter(v => v !== a._id)
                    : [a._id, ...old.visited].slice(0, 500),
                }));
                if (!visited) void ads.completedAction();
              }}
            />
            <Button
              secondary
              title={bucket ? 'On your bucket list' : 'Add to bucket list'}
              icon={<Bookmark color={t.gold} size={18} />}
              onPress={() => toggleSave(a, true)}
            />
            {state.collections.length > 0 && (
              <Button
                secondary
                title="Add to a collection"
                onPress={() => setCollectionPicker(true)}
              />
            )}
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderColor: t.line,
              marginTop: 30,
              paddingTop: 18,
            }}
          >
            <Label muted style={{ fontSize: 12 }}>
              Source:{' '}
              {a.source === 'osm'
                ? '© OpenStreetMap contributors · ODbL 1.0'
                : a.source}
            </Label>
            <Label muted style={{ fontSize: 11 }}>
              Verification: {a.verificationStatus || 'unverified'}
            </Label>
            {a.lastSyncedAt && (
              <Label muted style={{ fontSize: 11 }}>
                Last synchronized: {new Date(a.lastSyncedAt).toLocaleString()}
              </Label>
            )}
            {a.sourceUrl && (
              <Button
                secondary
                title="View original source"
                onPress={() => openUrl(a.sourceUrl)}
              />
            )}
          </View>
        </View>
      </SafeScrollView>
      <Modal
        visible={collectionPicker}
        animationType="slide"
        onRequestClose={() => setCollectionPicker(false)}
      >
        <AppShell>
          <Header
            title="Choose a collection"
            action={
              <Button
                secondary
                title="Done"
                onPress={() => setCollectionPicker(false)}
              />
            }
          />
          <SafeScrollView
            contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
          >
            {state.collections.map(c => (
              <Button
                key={c.id}
                secondary
                title={`${
                  c.activityIds.includes(a._id) ? 'Saved in ' : 'Add to '
                }${c.name}`}
                onPress={() => {
                  update(old => ({
                    ...old,
                    collections: old.collections.map(v =>
                      v.id === c.id
                        ? {
                            ...v,
                            activityIds: [
                              ...new Set([...v.activityIds, a._id]),
                            ],
                          }
                        : v,
                    ),
                    favorites: old.favorites.some(v => v._id === a._id)
                      ? old.favorites
                      : [a, ...old.favorites],
                  }));
                  setCollectionPicker(false);
                }}
              />
            ))}
          </SafeScrollView>
        </AppShell>
      </Modal>
      <Modal
        visible={gallery}
        animationType="fade"
        onRequestClose={() => setGallery(false)}
      >
        <AppShell>
          <Header
            title="A closer look."
            action={
              <Pressable
                accessibilityLabel="Close gallery"
                onPress={() => setGallery(false)}
                style={{ padding: 12 }}
              >
                <X color={t.text} />
              </Pressable>
            }
          />
          <SafeScrollView>
            {a.images?.map((photo, i) => (
              <View key={i} style={{ marginBottom: 24 }}>
                <PhotoView photo={photo} style={{ height: 380 }} />
                <View style={{ padding: 20 }}>
                  <Label>{photo.alt}</Label>
                  <Label muted style={{ fontSize: 12 }}>
                    {photo.credit} · {photo.license}
                  </Label>
                  {photo.sourceUrl && (
                    <Button
                      secondary
                      title="Photo source"
                      onPress={() => openUrl(photo.sourceUrl)}
                    />
                  )}
                </View>
              </View>
            ))}
          </SafeScrollView>
        </AppShell>
      </Modal>
    </AppShell>
  );
}
