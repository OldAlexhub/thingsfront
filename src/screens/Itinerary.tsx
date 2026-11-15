import React, { useState } from 'react';
import { View, Pressable, Alert, Share } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Navigation,
  Bookmark,
  Check,
} from 'lucide-react-native';
import { api, native } from '../api';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import {
  AppShell,
  Header,
  Label,
  Button,
  Notice,
  Empty,
  PhotoView,
  spacing,
  openUrl,
} from '../components';
import type { Activity, Plan, Stop } from '../types';
export function planText(plan: Plan) {
  return [
    `${plan.cityName} · ${plan.date}`,
    `Timezone: ${plan.timezone}`,
    ...plan.stops.flatMap((s, i) => [
      `${i + 1}. ${s.startTime}–${s.endTime}: ${s.activity.title}`,
      s.activity.location?.address || '',
      `Travel: about ${s.travel.minutes} min (rough estimate)`,
      ...s.warnings,
    ]),
    `Known admission subtotal: $${plan.knownAdmissionTotal.toFixed(2)}`,
    ...plan.warnings,
    'Planned with Things to Do by Old Alex Hub',
  ]
    .filter(Boolean)
    .join('\n');
}
export function ItineraryScreen() {
  const route = useRoute<any>(),
    nav = useNavigation<any>(),
    inset = useSafeAreaInsets(),
    t = useTheme(),
    { savePlan } = useLocal(),
    [plan, setPlan] = useState<Plan>(route.params.plan),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function recalculate(ids: string[]) {
    setBusy(true);
    try {
      const r = await api<Plan>(
        '/itineraries/recalculate',
        { ...plan.input, stopIds: ids },
        false,
      );
      setPlan({ ...r.data, id: plan.id });
      setSaved(false);
    } catch (e) {
      Alert.alert('Could not update your plan', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function replace(index: number) {
    setBusy(true);
    try {
      const input = {
        ...plan.input,
        exclude: [
          ...plan.input.exclude,
          ...plan.stops.map(s => s.activity._id),
        ],
      };
      delete input.stopIds;
      const options = await api<{ activity: Activity }[]>(
        '/recommendations',
        input,
        false,
      );
      if (!options.data.length) {
        Alert.alert(
          'No replacement found',
          'Try adjusting your budget, available time or interests.',
        );
        return;
      }
      const ids = plan.stops.map((s, i) =>
        i === index ? options.data[0].activity._id : s.activity._id,
      );
      const r = await api<Plan>(
        '/itineraries/recalculate',
        { ...plan.input, stopIds: ids },
        false,
      );
      setPlan({ ...r.data, id: plan.id });
      setSaved(false);
    } catch (e) {
      Alert.alert('Could not replace this stop', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, step: number) {
    const ids = plan.stops.map(s => s.activity._id),
      next = index + step;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void recalculate(ids);
  }
  function render({ item, drag, isActive, getIndex }: RenderItemParams<Stop>) {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <View
          style={{
            marginHorizontal: 22,
            marginBottom: 18,
            backgroundColor: t.surface,
            borderRadius: 22,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isActive ? t.teal : t.line,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.activity.title}`}
            onPress={() => nav.navigate('Detail', { activity: item.activity })}
          >
            <PhotoView
              photo={item.activity.images?.[0]}
              style={{ height: 150 }}
            />
            <View style={{ padding: 18 }}>
              <View style={spacing.between}>
                <Label
                  style={{ fontSize: 12, color: t.teal, fontWeight: '800' }}
                >
                  {item.startTime} – {item.endTime}
                </Label>
                <Pressable
                  disabled={busy}
                  onLongPress={drag}
                  accessibilityRole="button"
                  accessibilityLabel="Hold to reorder stop"
                  style={{ padding: 8 }}
                >
                  <GripVertical color={t.muted} />
                </Pressable>
              </View>
              <Label style={{ fontSize: 22, fontWeight: '800', marginTop: 6 }}>
                {item.activity.title}
              </Label>
              <Label muted style={{ fontSize: 12, marginTop: 8 }}>
                About {item.travel.minutes} min travel · geographic estimate
              </Label>
              <Label style={{ fontSize: 13, marginTop: 8 }}>
                {item.groupCost === null
                  ? 'Group price unknown'
                  : `Estimated admission: $${item.groupCost.toFixed(2)}`}
              </Label>
              <Label muted style={{ fontSize: 12, marginTop: 8 }}>
                {item.reasons.join(' · ')}
              </Label>
              {item.warnings.map((warning, i) => (
                <Label key={i} muted style={{ fontSize: 11, marginTop: 6 }}>
                  • {warning}
                </Label>
              ))}
            </View>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              padding: 10,
              borderTopWidth: 1,
              borderColor: t.line,
            }}
          >
            {[
              {
                label: 'Move up',
                icon: ArrowUp,
                action: () => move(index, -1),
                disabled: index === 0,
              },
              {
                label: 'Move down',
                icon: ArrowDown,
                action: () => move(index, 1),
                disabled: index === plan.stops.length - 1,
              },
              {
                label: 'Replace stop',
                icon: RefreshCw,
                action: () => void replace(index),
              },
              {
                label: 'Remove stop',
                icon: Trash2,
                action: () =>
                  void recalculate(
                    plan.stops
                      .filter((_, i) => i !== index)
                      .map(s => s.activity._id),
                  ),
              },
              {
                label: 'Open directions',
                icon: Navigation,
                action: () => {
                  const c = item.activity.coordinates?.coordinates;
                  if (c)
                    void openUrl(
                      `https://www.google.com/maps/dir/?api=1&destination=${c[1]},${c[0]}`,
                    );
                },
                disabled: !item.activity.coordinates,
              },
            ].map(b => (
              <Pressable
                key={b.label}
                accessibilityRole="button"
                accessibilityLabel={b.label}
                disabled={busy || b.disabled}
                onPress={b.action}
                style={{ padding: 12, opacity: busy || b.disabled ? 0.35 : 1 }}
              >
                <b.icon color={t.teal} size={18} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScaleDecorator>
    );
  }
  return (
    <AppShell>
      <DraggableFlatList
        data={plan.stops}
        keyExtractor={s => s.activity._id}
        renderItem={render}
        onDragEnd={({ data }) => {
          if (!busy) void recalculate(data.map(s => s.activity._id));
        }}
        activationDistance={12}
        ListHeaderComponent={
          <>
            <Header
              back
              title="This is your kind of day."
              kicker={`${plan.cityName.toUpperCase()} / ${plan.date}`}
            />
            <View style={{ paddingHorizontal: 22, marginBottom: 20 }}>
              <Label muted>
                {plan.timezone} · {plan.stops.length} stops ·{' '}
                {plan.input.transport}
              </Label>
              <View
                style={{
                  backgroundColor: t.raised,
                  padding: 20,
                  borderRadius: 20,
                  marginTop: 18,
                }}
              >
                <Label muted style={{ fontSize: 12 }}>
                  KNOWN ADMISSION SUBTOTAL
                </Label>
                <Label
                  style={{ fontSize: 34, fontWeight: '800', marginVertical: 8 }}
                >
                  ${plan.knownAdmissionTotal.toFixed(2)}
                </Label>
                <Label muted style={{ fontSize: 12 }}>
                  ${plan.remainingAdmissionBudget.toFixed(2)} of admission
                  budget remains · {plan.unknownCostCount} unknown prices
                </Label>
              </View>
              {plan.warnings.map((w, i) => (
                <Notice key={i}>{w}</Notice>
              ))}
              {busy && (
                <Notice>Recalculating the route, timing and costs…</Notice>
              )}
              <View style={spacing.row}>
                <Button
                  style={{ flex: 1 }}
                  secondary
                  title="Adjust the day"
                  onPress={() =>
                    nav.navigate('Main', {
                      screen: 'Plan',
                      params: { input: plan.input },
                    })
                  }
                />
                <Button
                  style={{ flex: 1 }}
                  secondary
                  title="View map"
                  onPress={() =>
                    nav.navigate('Map', {
                      activities: plan.stops.map(s => s.activity),
                      title: 'Your day, mapped out.',
                    })
                  }
                />
              </View>
              <Label muted style={{ fontSize: 11, marginTop: 14 }}>
                Hold the grip to drag stops. Arrow buttons also change the
                order.
              </Label>
            </View>
          </>
        }
        ListEmptyComponent={
          <Empty
            title="A little more room to explore."
            message="There are no eligible stops for these settings. Try a wider area, another time, or allow unknown prices."
            action="Adjust your day"
            onAction={() =>
              nav.navigate('Main', {
                screen: 'Plan',
                params: { input: plan.input },
              })
            }
          />
        }
        ListFooterComponent={
          <View
            style={{
              padding: 22,
              paddingBottom: Math.max(inset.bottom, 18) + 24,
            }}
          >
            {plan.breaks.length > 0 && (
              <>
                <Label
                  style={{ fontSize: 20, fontWeight: '800', marginBottom: 10 }}
                >
                  A little breathing room
                </Label>
                {plan.breaks.map((b, i) => (
                  <Label
                    muted
                    key={i}
                    style={{ fontSize: 13, marginBottom: 8 }}
                  >
                    {b.startTime}–{b.endTime} · {b.note}
                  </Label>
                ))}
              </>
            )}
            <Button
              title={saved ? 'Day saved' : 'Save this day'}
              disabled={busy || !plan.stops.length}
              icon={
                saved ? (
                  <Check color="#fff" size={18} />
                ) : (
                  <Bookmark color="#fff" size={18} />
                )
              }
              onPress={() => {
                savePlan(plan);
                setSaved(true);
                Alert.alert(
                  'Day saved',
                  'You can read this itinerary offline from Saved.',
                );
              }}
            />
            <View style={[spacing.row, { marginTop: 12 }]}>
              <Button
                style={{ flex: 1 }}
                secondary
                title="Share"
                disabled={!plan.stops.length || busy}
                onPress={() =>
                  Share.share({ message: planText(plan) }).catch(() =>
                    Alert.alert('Could not share', 'Try again.'),
                  )
                }
              />
              <Button
                style={{ flex: 1 }}
                secondary
                title="Export file"
                disabled={!plan.stops.length || busy}
                onPress={() =>
                  native
                    .exportFile(
                      `things-to-do-${plan.date}.json`,
                      JSON.stringify(plan, null, 2),
                    )
                    .then(() =>
                      Alert.alert(
                        'Export complete',
                        'Your itinerary has been saved.',
                      ),
                    )
                    .catch(e => Alert.alert('Export', (e as Error).message))
                }
              />
            </View>
          </View>
        }
      />
    </AppShell>
  );
}
