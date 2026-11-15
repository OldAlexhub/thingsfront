import React, { useEffect, useState } from 'react';
import { View, Switch, Alert, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useData, usePlanDefaults } from '../data';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import { api } from '../api';
import { fromKilometers, toKilometers, distanceLabel } from '../units';
import {
  KeyboardSafeScreen,
  SafeScrollView,
  Header,
  Label,
  Field,
  Button,
  Chip,
  Notice,
  Empty,
  spacing,
} from '../components';
import { currentLocation } from './Explore';
import type { PlanInput, Plan } from '../types';

export function PlannerScreen() {
  const { city, categories } = useData(),
    { state } = useLocal(),
    defaults = usePlanDefaults(),
    nav = useNavigation<any>(),
    route = useRoute<any>(),
    t = useTheme();
  const [form, setForm] = useState<PlanInput>(),
    [step, setStep] = useState(0),
    [budget, setBudget] = useState(String(state.budget)),
    [ages, setAges] = useState(state.childAges.join(', ')),
    [picker, setPicker] = useState<'date' | 'time'>(),
    [busy, setBusy] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (defaults && (!form || form.cityId !== defaults.cityId))
      setForm({
        ...defaults,
        startTime: '10:00',
        endTime: '16:00',
        radiusKm: toKilometers(10, 'mi'),
      });
  }, [defaults, form]);
  useEffect(() => {
    const input = route.params?.input as PlanInput | undefined;
    if (input) {
      setForm(input);
      setBudget(String(input.budget));
      setAges(input.childAges.join(', '));
      setStep(2);
    }
  }, [route.params]);
  function change<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm(old => (old ? { ...old, [key]: value } : old));
    setError('');
  }
  const startMinutes = form
    ? Number(form.startTime.slice(0, 2)) * 60 + Number(form.startTime.slice(3))
    : 600;
  const duration = form
    ? (Number(form.endTime.slice(0, 2)) * 60 +
        Number(form.endTime.slice(3)) -
        startMinutes) /
      60
    : 6;
  function setHours(hours: number, start = startMinutes) {
    const finish = Math.min(1439, start + hours * 60);
    change(
      'endTime',
      `${String(Math.floor(finish / 60)).padStart(2, '0')}:${String(
        finish % 60,
      ).padStart(2, '0')}`,
    );
  }
  function displayTime(value: string) {
    const [h, m] = value.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${
      h >= 12 ? 'PM' : 'AM'
    }`;
  }
  async function generate() {
    if (!form || !city) return;
    const children = ages.trim()
      ? ages.split(',').map(v => Number(v.trim()))
      : [];
    if (
      !budget.trim() ||
      !Number.isFinite(Number(budget)) ||
      Number(budget) < 0 ||
      Number(budget) > 1000000 ||
      children.length > 20 ||
      children.some(v => !Number.isInteger(v) || v < 0 || v > 17)
    ) {
      setError('Enter a valid budget and children’s ages from 0 to 17.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const input = {
        ...form,
        budget: Number(budget),
        childAges: children,
        visited: state.visited,
      };
      delete input.stopIds;
      const result = await api<Plan>('/itineraries/generate', input, false);
      nav.navigate('Itinerary', { plan: result.data });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!city || !form)
    return (
      <KeyboardSafeScreen>
        <Empty
          message="Choose a city to start your next good day."
          action="Choose city"
          onAction={() => nav.navigate('CityPicker')}
        />
      </KeyboardSafeScreen>
    );
  const section = {
    backgroundColor: t.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  };
  return (
    <KeyboardSafeScreen>
      <SafeScrollView key={step} keyboardShouldPersistTaps="handled">
        <Header
          title={
            [
              'A day to look forward to.',
              'Make it your kind of day.',
              'A little planning. A great day.',
            ][step]
          }
          kicker={`PLAN YOUR DAY · ${city.name.toUpperCase()}`}
        />
        <View style={{ paddingHorizontal: 22 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {['When', 'Your style', 'Budget & go'].map((label, i) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={`Step ${i + 1}: ${label}`}
                onPress={() => !busy && setStep(i)}
                style={{ flex: 1, gap: 8 }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 4,
                    backgroundColor: i <= step ? t.teal : t.line,
                  }}
                />
                <Label
                  style={{
                    fontSize: 11,
                    fontWeight: i === step ? '800' : '500',
                    color: i === step ? t.teal : t.muted,
                  }}
                >
                  {i + 1}. {label}
                </Label>
              </Pressable>
            ))}
          </View>
          {step === 0 && (
            <>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 16 }}
                >
                  Where and when?
                </Label>
                <Button
                  secondary
                  title={city.name}
                  icon={<MapPin size={18} color={t.teal} />}
                  onPress={() => nav.navigate('CityPicker')}
                />
                <View style={{ height: 12 }} />
                <Button
                  secondary
                  title={new Date(form.date + 'T12:00:00').toLocaleDateString(
                    'en-US',
                    { weekday: 'short', month: 'short', day: 'numeric' },
                  )}
                  icon={<CalendarDays size={18} color={t.teal} />}
                  onPress={() => setPicker('date')}
                />
                <View style={{ height: 12 }} />
                <Button
                  secondary
                  title={`Start at ${displayTime(form.startTime)}`}
                  icon={<Clock3 size={18} color={t.teal} />}
                  onPress={() => setPicker('time')}
                />
                <Label muted style={{ fontSize: 12, marginTop: 12 }}>
                  Local time in {city.name}.
                </Label>
              </View>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 16 }}
                >
                  How much time do you have?
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {[2, 4, 6, 8].map(h => (
                    <Chip
                      key={h}
                      title={`${h} hours`}
                      selected={Math.abs(duration - h) < 0.02}
                      onPress={() => setHours(h)}
                    />
                  ))}
                </View>
                <Label muted style={{ fontSize: 13, marginTop: 8 }}>
                  {displayTime(form.startTime)} · {displayTime(form.endTime)} ?
                  Space to enjoy each stop.
                </Label>
              </View>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 12 }}
                >
                  Who is coming?
                </Label>
                <View style={spacing.between}>
                  <Label>Adults</Label>
                  <View style={spacing.row}>
                    <Button
                      secondary
                      title="-"
                      onPress={() =>
                        change('adults', Math.max(1, form.adults - 1))
                      }
                      disabled={form.adults <= 1}
                    />
                    <Label style={{ fontSize: 22, fontWeight: '800' }}>
                      {form.adults}
                    </Label>
                    <Button
                      secondary
                      title="+"
                      onPress={() =>
                        change('adults', Math.min(30, form.adults + 1))
                      }
                      disabled={form.adults >= 30}
                    />
                  </View>
                </View>
                <View style={{ marginTop: 18 }}>
                  <Field
                    label="Children’s ages (optional)"
                    placeholder="e.g. 5, 9"
                    value={ages}
                    onChangeText={setAges}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </>
          )}
          {step === 1 && (
            <>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 8 }}
                >
                  What sounds good?
                </Label>
                <Label muted style={{ fontSize: 13, marginBottom: 18 }}>
                  Pick a few interests, or leave it open.
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {categories
                    .filter(c => !c.parentId)
                    .slice(0, 8)
                    .map(c => (
                      <Chip
                        key={c._id}
                        title={c.name}
                        selected={form.interests.includes(c._id)}
                        onPress={() =>
                          change(
                            'interests',
                            form.interests.includes(c._id)
                              ? form.interests.filter(v => v !== c._id)
                              : [...form.interests, c._id],
                          )
                        }
                      />
                    ))}
                </View>
              </View>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 16 }}
                >
                  How will you get around?
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(
                    [
                      ['driving', 'Driving'],
                      ['walking', 'Walking'],
                      ['cycling', 'Biking'],
                      ['transit', 'Transit'],
                    ] as const
                  ).map(([v, label]) => (
                    <Chip
                      key={v}
                      title={label}
                      selected={form.transport === v}
                      onPress={() => {
                        change('transport', v);
                        change(
                          'radiusKm',
                          toKilometers(
                            v === 'walking' ? 2 : v === 'cycling' ? 5 : 10,
                            'mi',
                          ),
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 16 }}
                >
                  Set your pace
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(
                    [
                      ['relaxed', 'Take it easy'],
                      ['balanced', 'A little of everything'],
                      ['active', 'Fit more in'],
                    ] as const
                  ).map(([v, label]) => (
                    <Chip
                      key={v}
                      title={label}
                      selected={form.pace === v}
                      onPress={() => change('pace', v)}
                    />
                  ))}
                </View>
                <Label muted style={{ fontSize: 12, marginTop: 8 }}>
                  We leave breathing room between experiences.
                </Label>
              </View>
            </>
          )}
          {step === 2 && (
            <>
              <View style={section}>
                <Label
                  style={{ fontSize: 21, fontWeight: '800', marginBottom: 8 }}
                >
                  Your admission budget
                </Label>
                <Label muted style={{ fontSize: 13, marginBottom: 18 }}>
                  Total for everyone. Meals and travel are extra.
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {[0, 50, 100, 200].map(v => (
                    <Chip
                      key={v}
                      title={v === 0 ? 'Free day' : `$${v}`}
                      selected={Number(budget) === v}
                      onPress={() => setBudget(String(v))}
                    />
                  ))}
                </View>
                <Field
                  label="Or set your own total ($)"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                />
                <View style={spacing.between}>
                  <View style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '700' }}>
                      Only places with listed prices
                    </Label>
                    <Label muted style={{ fontSize: 12, marginTop: 4 }}>
                      Keeps admission within your budget.
                    </Label>
                  </View>
                  <Switch
                    accessibilityLabel="Only places with listed prices"
                    value={form.strictBudget}
                    onValueChange={v => change('strictBudget', v)}
                  />
                </View>
              </View>
              <View style={{ ...section, backgroundColor: t.raised }}>
                <Label
                  style={{ fontSize: 19, fontWeight: '800', marginBottom: 12 }}
                >
                  Your day at a glance
                </Label>
                <Label>
                  {city.name} · {displayTime(form.startTime)} ·{' '}
                  {displayTime(form.endTime)}
                </Label>
                <Label muted style={{ fontSize: 13, marginTop: 8 }}>
                  {form.adults} {form.adults === 1 ? 'adult' : 'adults'}
                  {ages.trim()
                    ? ` + ${ages.split(',').length} children`
                    : ''} · {form.transport} ·{' '}
                  {distanceLabel(form.radiusKm, state.distanceUnit)} radius
                </Label>
                <Label muted style={{ fontSize: 13, marginTop: 8 }}>
                  Starting near{' '}
                  {form.start?.[0] === city.longitude
                    ? 'the city center'
                    : 'your selected location'}
                  .
                </Label>
              </View>
              <Button
                secondary
                title={advanced ? 'Hide more options' : 'More options'}
                onPress={() => setAdvanced(v => !v)}
              />
              {advanced && (
                <View style={{ ...section, marginTop: 16 }}>
                  <Label
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      marginBottom: 12,
                    }}
                  >
                    Keep it nearby
                  </Label>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {(state.distanceUnit === 'mi'
                      ? [2, 5, 10, 20]
                      : [3, 8, 16, 32]
                    ).map(v => (
                      <Chip
                        key={v}
                        title={`${v} ${state.distanceUnit}`}
                        selected={
                          Math.abs(
                            fromKilometers(form.radiusKm, state.distanceUnit) -
                              v,
                          ) < 0.2
                        }
                        onPress={() =>
                          change(
                            'radiusKm',
                            toKilometers(v, state.distanceUnit),
                          )
                        }
                      />
                    ))}
                  </View>
                  <Button
                    secondary
                    title="Start near me"
                    onPress={() =>
                      currentLocation()
                        .then(p => change('start', [p.longitude, p.latitude]))
                        .catch(e =>
                          Alert.alert('Location unavailable', e.message),
                        )
                    }
                  />
                  <View style={{ height: 12 }} />
                  <Button
                    secondary
                    title="Use city center"
                    onPress={() =>
                      change('start', [city.longitude, city.latitude])
                    }
                  />
                  <Label muted style={{ marginVertical: 14 }}>
                    Setting
                  </Label>
                  <View style={{ flexDirection: 'row' }}>
                    {(['any', 'indoor', 'outdoor'] as const).map(v => (
                      <Chip
                        key={v}
                        title={
                          v === 'any'
                            ? 'Any'
                            : v === 'indoor'
                            ? 'Indoors'
                            : 'Outdoors'
                        }
                        selected={form.environment === v}
                        onPress={() => change('environment', v)}
                      />
                    ))}
                  </View>
                  <View style={spacing.between}>
                    <Label>Leave time for lunch</Label>
                    <Switch
                      accessibilityLabel="Leave time for lunch"
                      value={form.meals}
                      onValueChange={v => change('meals', v)}
                    />
                  </View>
                </View>
              )}
            </>
          )}
          {error && <Notice>{error}</Notice>}
          {busy && (
            <Notice>
              Finding nearby experiences and arranging your stops...
            </Notice>
          )}
        </View>
      </SafeScrollView>
      <View
        style={{
          paddingHorizontal: 22,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: t.line,
          backgroundColor: t.bg,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        {step > 0 && (
          <Button
            secondary
            title="Back"
            disabled={busy}
            onPress={() => {
              setStep(v => v - 1);
              setError('');
            }}
          />
        )}
        <Button
          style={{ flex: 1 }}
          title={
            step === 2
              ? busy
                ? 'Planning your day...'
                : 'Build my day'
              : 'Continue'
          }
          disabled={busy}
          onPress={() => (step === 2 ? void generate() : setStep(v => v + 1))}
          icon={
            step === 2 ? (
              <Sparkles size={18} color="#fff" />
            ) : (
              <ChevronRight size={18} color="#fff" />
            )
          }
        />
      </View>
      {picker && (
        <DateTimePicker
          mode={picker}
          is24Hour={false}
          value={new Date(form.date + 'T' + form.startTime + ':00')}
          onChange={(_event, date) => {
            setPicker(undefined);
            if (!date) return;
            if (picker === 'date') {
              change(
                'date',
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                  2,
                  '0',
                )}-${String(date.getDate()).padStart(2, '0')}`,
              );
            } else {
              const start = date.getHours() * 60 + date.getMinutes();
              change(
                'startTime',
                `${String(date.getHours()).padStart(2, '0')}:${String(
                  date.getMinutes(),
                ).padStart(2, '0')}`,
              );
              setHours(duration, start);
            }
          }}
        />
      )}
    </KeyboardSafeScreen>
  );
}
