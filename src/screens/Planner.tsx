import React, { useEffect, useState, useRef } from 'react';
import { View, Switch, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  LocateFixed,
  CalendarDays,
  Sparkles,
  MapPin,
} from 'lucide-react-native';
import { useData, usePlanDefaults } from '../data';
import { useLocal } from '../storage';
import { useTheme } from '../theme';
import { api } from '../api';
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
  const [form, setForm] = useState<PlanInput | undefined>(defaults),
    [budget, setBudget] = useState(String(state.budget)),
    [adults, setAdults] = useState(String(state.adults)),
    [ages, setAges] = useState(state.childAges.join(', ')),
    [radius, setRadius] = useState('30'),
    [lat, setLat] = useState(''),
    [lon, setLon] = useState(''),
    [busy, setBusy] = useState(false),
    [datePicker, setDatePicker] = useState(false),
    [error, setError] = useState('');
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  useEffect(() => {
    const current = defaultsRef.current;
    if (current) {
      setForm(current);
      setBudget(String(current.budget));
      setAdults(String(current.adults));
      setAges(current.childAges.join(', '));
      setLat(String(current.start![1]));
      setLon(String(current.start![0]));
    }
  }, [
    city?._id,
    state.budget,
    state.adults,
    state.childAges,
    state.interests,
    state.mode,
  ]);
  useEffect(() => {
    const input = route.params?.input as PlanInput | undefined;
    if (input) {
      setForm(input);
      setBudget(String(input.budget));
      setAdults(String(input.adults));
      setAges(input.childAges.join(', '));
      setRadius(String(input.radiusKm));
      setLat(String(input.start?.[1] ?? ''));
      setLon(String(input.start?.[0] ?? ''));
    }
  }, [route.params]);
  function change<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm(old => (old ? { ...old, [key]: value } : old));
  }
  async function generate() {
    if (!form || !city) return;
    const children = ages.trim()
      ? ages.split(',').map(v => Number(v.trim()))
      : [];
    if (
      !budget.trim() ||
      !adults.trim() ||
      !radius.trim() ||
      !lat.trim() ||
      !lon.trim() ||
      [
        ...children,
        Number(budget),
        Number(adults),
        Number(radius),
        Number(lat),
        Number(lon),
      ].some(v => !Number.isFinite(v))
    ) {
      setError('Enter valid numbers for budget, group, radius and location.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const input = {
        ...form,
        cityId: city._id,
        budget: Number(budget),
        adults: Number(adults),
        childAges: children,
        radiusKm: Number(radius),
        start: [Number(lon), Number(lat)] as [number, number],
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
          message="Choose a published city before planning your day."
          action="Choose city"
          onAction={() => nav.navigate('CityPicker')}
        />
      </KeyboardSafeScreen>
    );
  return (
    <KeyboardSafeScreen>
      <SafeScrollView>
        <Header title="Your day. Your way." kicker="PLAN SOMETHING GOOD" />
        <View style={{ paddingHorizontal: 22 }}>
          <Label muted>
            Tell us what a good day looks like. We will bring the possibilities
            together.
          </Label>
          <View
            style={{
              backgroundColor: t.surface,
              padding: 20,
              borderRadius: 22,
              marginVertical: 24,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            {!!city.planTemplates?.length && (
              <View style={{ marginBottom: 24 }}>
                <Label muted style={{ marginBottom: 12 }}>
                  Start with a city day plan
                </Label>
                {city.planTemplates.map(template => (
                  <View key={template.key} style={{ marginBottom: 12 }}>
                    <Button
                      secondary
                      title={template.title}
                      onPress={() => {
                        setForm(old =>
                          old ? { ...old, ...template.defaults } : old,
                        );
                        if (template.defaults.budget !== undefined)
                          setBudget(String(template.defaults.budget));
                        if (template.defaults.radiusKm !== undefined)
                          setRadius(String(template.defaults.radiusKm));
                      }}
                    />
                    {template.description && (
                      <Label muted style={{ fontSize: 12, marginTop: 6 }}>
                        {template.description}
                      </Label>
                    )}
                  </View>
                ))}
              </View>
            )}
            <Label
              style={[spacing.eyebrow, { color: t.gold, marginBottom: 14 }]}
            >
              01 / THE WHEN & WHERE
            </Label>
            <Button
              secondary
              title={`${city.name}, ${city.state}`}
              icon={<MapPin color={t.teal} size={18} />}
              onPress={() => nav.navigate('CityPicker')}
            />
            <View style={{ height: 14 }} />
            <Button
              secondary
              title={form.date}
              icon={<CalendarDays color={t.teal} size={18} />}
              onPress={() => setDatePicker(true)}
            />
            {datePicker && (
              <DateTimePicker
                mode="date"
                value={new Date(form.date + 'T12:00:00')}
                onChange={(_event, date) => {
                  setDatePicker(false);
                  if (date)
                    change(
                      'date',
                      `${date.getFullYear()}-${String(
                        date.getMonth() + 1,
                      ).padStart(2, '0')}-${String(date.getDate()).padStart(
                        2,
                        '0',
                      )}`,
                    );
                }}
              />
            )}
            <View style={[spacing.row, { marginTop: 18 }]}>
              <Field
                label="Start time (24-hour)"
                value={form.startTime}
                onChangeText={v => change('startTime', v)}
                placeholder="09:00"
              />
              <Field
                label="Finish by (24-hour)"
                value={form.endTime}
                onChangeText={v => change('endTime', v)}
                placeholder="18:00"
              />
            </View>
            <Label muted style={{ fontSize: 12, marginBottom: 16 }}>
              Times are local to {city.timezone}.
            </Label>
            <Button
              secondary
              title="Start near me"
              icon={<LocateFixed size={18} color={t.teal} />}
              onPress={() =>
                currentLocation()
                  .then(p => {
                    setLat(String(p.latitude));
                    setLon(String(p.longitude));
                  })
                  .catch(e => Alert.alert('Location unavailable', e.message))
              }
            />
            <Label
              muted
              style={{ fontSize: 12, marginTop: 14, marginBottom: 14 }}
            >
              The starting point defaults to the city center. Set your location
              or enter coordinates.
            </Label>
            <View style={spacing.row}>
              <Field
                label="Latitude"
                value={lat}
                onChangeText={setLat}
                keyboardType="numbers-and-punctuation"
              />
              <Field
                label="Longitude"
                value={lon}
                onChangeText={setLon}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Field
              label="Maximum radius (km)"
              value={radius}
              onChangeText={setRadius}
              keyboardType="numeric"
            />
          </View>
          <View style={{ marginBottom: 24 }}>
            <Label
              style={[spacing.eyebrow, { color: t.gold, marginBottom: 18 }]}
            >
              02 / YOUR PEOPLE & BUDGET
            </Label>
            <View style={spacing.row}>
              <Field
                label="Admission budget ($)"
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
              />
              <Field
                label="Adults"
                value={adults}
                onChangeText={setAdults}
                keyboardType="number-pad"
              />
            </View>
            <Field
              label="Children's ages, separated by commas"
              value={ages}
              onChangeText={setAges}
              keyboardType="numbers-and-punctuation"
              placeholder="For example: 5, 9"
            />
            <View style={spacing.between}>
              <View style={{ flex: 1 }}>
                <Label>Keep to known prices</Label>
                <Label muted style={{ fontSize: 12 }}>
                  Exclude activities with unknown group costs.
                </Label>
              </View>
              <Switch
                accessibilityLabel="Keep to known prices"
                value={form.strictBudget}
                onValueChange={v => change('strictBudget', v)}
              />
            </View>
            <Notice>
              Admission estimates exclude meals, transport, taxes and fees.
              Verify prices and availability before going.
            </Notice>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {(['local', 'tourist'] as const).map(v => (
                <Chip
                  key={v}
                  title={v === 'local' ? 'I live here' : 'I’m visiting'}
                  selected={form.mode === v}
                  onPress={() => change('mode', v)}
                />
              ))}
            </View>
          </View>
          <Label style={[spacing.eyebrow, { color: t.gold, marginBottom: 18 }]}>
            03 / YOUR KIND OF ADVENTURE
          </Label>
          <Label muted style={{ marginBottom: 12 }}>
            Choose your interests
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {categories.map(c => (
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
          <Label muted style={{ marginTop: 18, marginBottom: 10 }}>
            Getting around
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['walking', 'cycling', 'driving', 'transit'] as const).map(v => (
              <Chip
                key={v}
                title={v}
                selected={form.transport === v}
                onPress={() => change('transport', v)}
              />
            ))}
          </View>
          <Label muted style={{ marginTop: 18, marginBottom: 10 }}>
            Set your pace
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['relaxed', 'balanced', 'active'] as const).map(v => (
              <Chip
                key={v}
                title={v}
                selected={form.pace === v}
                onPress={() => change('pace', v)}
              />
            ))}
          </View>
          <Label muted style={{ marginTop: 18, marginBottom: 10 }}>
            The setting
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['any', 'indoor', 'outdoor'] as const).map(v => (
              <Chip
                key={v}
                title={v}
                selected={form.environment === v}
                onPress={() => change('environment', v)}
              />
            ))}
          </View>
          <Label muted style={{ marginTop: 18, marginBottom: 10 }}>
            Conditions to plan for
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['any', 'dry', 'rain', 'heat', 'cold'] as const).map(weather => (
              <Chip
                key={weather}
                title={weather === 'any' ? 'No preference' : weather}
                selected={(form.weather || 'any') === weather}
                onPress={() => change('weather', weather)}
              />
            ))}
          </View>
          <Label muted style={{ fontSize: 11 }}>
            Your preference, not a forecast. Weather fit is used only when a
            venue has matching information.
          </Label>
          <View style={[spacing.between, { marginVertical: 24 }]}>
            <Label>Leave time for a meal</Label>
            <Switch
              accessibilityLabel="Leave time for a meal"
              value={form.meals}
              onValueChange={v => change('meals', v)}
            />
          </View>
          {error && <Notice>{error}</Notice>}
          <Button
            title={busy ? 'Putting your day together…' : 'Make a day of it'}
            disabled={busy}
            icon={<Sparkles size={18} color="#fff" />}
            onPress={generate}
          />
          <Label
            muted
            style={{ fontSize: 11, textAlign: 'center', marginTop: 14 }}
          >
            Thoughtful recommendations from real listed experiences.
          </Label>
        </View>
      </SafeScrollView>
    </KeyboardSafeScreen>
  );
}
