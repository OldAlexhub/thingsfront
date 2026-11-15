import React, { useState } from 'react';
import { View, Alert, Image, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocal } from '../storage';
import { useData } from '../data';
import { api, clearCache, native } from '../api';
import { useAds } from '../ads';
import {
  AppShell,
  SafeScrollView,
  Header,
  Label,
  Button,
  Field,
  Chip,
  Notice,
  spacing,
  openUrl,
} from '../components';
export async function checkUpdates() {
  const r = await api<{
    updateAvailable: boolean;
    updateRequired: boolean;
    releaseNotes: string[];
  }>(
    '/app/version?currentVersionCode=' + (native?.VERSION_CODE || 1),
    undefined,
    false,
  );
  if (!r.data.updateAvailable) {
    Alert.alert('You’re up to date', 'No newer version has been announced.');
    return;
  }
  const result = await native.checkForUpdate(r.data.updateRequired);
  if (result !== 'started')
    Alert.alert(
      'Update announcement',
      `A newer version has been announced. Google Play has no installable update for this device yet.\n\n${r.data.releaseNotes.join(
        '\n',
      )}`,
    );
}
export function SettingsScreen() {
  const { state, patch, clear } = useLocal(),
    { city, categories } = useData(),
    nav = useNavigation<any>(),
    ads = useAds(),
    [budget, setBudget] = useState(String(state.budget)),
    [adults, setAdults] = useState(String(state.adults)),
    [ages, setAges] = useState(state.childAges.join(', '));
  function preferences() {
    const b = Number(budget),
      a = Number(adults),
      c = ages.trim() ? ages.split(',').map(x => Number(x.trim())) : [];
    if (
      !budget.trim() ||
      !Number.isFinite(b) ||
      b < 0 ||
      b > 1000000 ||
      !Number.isInteger(a) ||
      a < 1 ||
      a > 30 ||
      c.length > 20 ||
      c.some(v => !Number.isInteger(v) || v < 0 || v > 17)
    ) {
      Alert.alert(
        'Check your preferences',
        'Use a nonnegative budget, 1–30 adults, and ages 0–17.',
      );
      return;
    }
    patch({ budget: b, adults: a, childAges: c });
    Alert.alert('Preferences saved', 'New plans will use these defaults.');
  }
  return (
    <AppShell>
      <SafeScrollView>
        <Header title="Make yourself at home." kicker="THE LITTLE DETAILS" />
        <View style={{ paddingHorizontal: 22 }}>
          <Label style={{ fontSize: 22, fontWeight: '800', marginBottom: 16 }}>
            Your preferences
          </Label>
          <Button
            secondary
            title={city ? `Your city: ${city.name}` : 'Choose your city'}
            onPress={() => nav.navigate('CityPicker')}
          />
          <View style={{ flexDirection: 'row', marginVertical: 18 }}>
            {(['local', 'tourist'] as const).map(v => (
              <Chip
                key={v}
                title={v === 'local' ? 'I live here' : 'I’m visiting'}
                selected={state.mode === v}
                onPress={() => patch({ mode: v })}
              />
            ))}
          </View>
          <View style={spacing.row}>
            <Field
              label="Default budget ($)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            <Field
              label="Adults"
              value={adults}
              onChangeText={setAdults}
              keyboardType="numeric"
            />
          </View>
          <Field
            label="Children's ages (comma-separated)"
            value={ages}
            onChangeText={setAges}
            placeholder="5, 9"
          />
          <Button secondary title="Save preferences" onPress={preferences} />
          <Label muted style={{ marginTop: 24, marginBottom: 10 }}>
            Your interests
          </Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <Chip
                key={c._id}
                title={c.name}
                selected={state.interests.includes(c._id)}
                onPress={() =>
                  patch({
                    interests: state.interests.includes(c._id)
                      ? state.interests.filter(id => id !== c._id)
                      : [...state.interests, c._id],
                  })
                }
              />
            ))}
          </View>
          <Label muted style={{ marginTop: 22, marginBottom: 10 }}>
            Appearance
          </Label>
          <View style={{ flexDirection: 'row' }}>
            {(['system', 'dark', 'light'] as const).map(v => (
              <Chip
                key={v}
                title={v}
                selected={state.theme === v}
                onPress={() => patch({ theme: v })}
              />
            ))}
          </View>
          <Label
            style={{
              fontSize: 22,
              fontWeight: '800',
              marginTop: 30,
              marginBottom: 18,
            }}
          >
            Privacy & your device
          </Label>
          <Notice>
            Favorites and preferences stay on this device. The app also connects
            to our server, map services and, when enabled, Google’s advertising
            services.
          </Notice>
          <View style={[spacing.between, { marginVertical: 18 }]}>
            <View style={{ flex: 1 }}>
              <Label>I am 18 or older</Label>
              <Label muted style={{ fontSize: 12 }}>
                Ads stay off without adult confirmation.
              </Label>
            </View>
            <Switch
              accessibilityLabel="I am 18 or older"
              value={state.ageConfirmed}
              onValueChange={value => patch({ ageConfirmed: value })}
            />
          </View>
          <View style={{ gap: 12 }}>
            <Button
              secondary
              title="Advertising privacy choices"
              onPress={() => void ads.privacy()}
            />
            <Button
              secondary
              title="Export all saved itineraries"
              onPress={() =>
                native
                  .exportFile(
                    'things-to-do-itineraries.json',
                    JSON.stringify(state.plans, null, 2),
                  )
                  .then(() =>
                    Alert.alert(
                      'Export complete',
                      'Your itineraries were exported.',
                    ),
                  )
                  .catch(e => Alert.alert('Export', e.message))
              }
            />
            <Button
              secondary
              title="Clear cached server content"
              onPress={() =>
                clearCache()
                  .then(() =>
                    Alert.alert(
                      'Cache cleared',
                      'Your saved items are still here.',
                    ),
                  )
                  .catch(() =>
                    Alert.alert('Could not clear cache', 'Try again.'),
                  )
              }
            />
            <Button
              secondary
              title="Delete all local data"
              onPress={() =>
                Alert.alert(
                  'Clear local data?',
                  'This deletes favorites, plans, collections, history and preferences.',
                  [
                    { text: 'Keep my data', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        Promise.all([clear(), clearCache()]).catch(() =>
                          Alert.alert('Deletion failed', 'Try again.'),
                        ),
                    },
                  ],
                )
              }
            />
          </View>
          <Label
            style={{
              fontSize: 22,
              fontWeight: '800',
              marginTop: 30,
              marginBottom: 18,
            }}
          >
            Made for your next good day.
          </Label>
          <View style={{ gap: 12 }}>
            <Button
              secondary
              title="Privacy policy"
              onPress={() => nav.navigate('Legal', { kind: 'privacy' })}
            />
            <Button
              secondary
              title="Terms & travel disclaimers"
              onPress={() => nav.navigate('Legal', { kind: 'terms' })}
            />
            <Button
              secondary
              title="Contact Old Alex Hub"
              onPress={() => openUrl('mailto:info@oldalexhub.com')}
            />
            <Button
              secondary
              title="Check for updates"
              onPress={() =>
                checkUpdates().catch(e =>
                  Alert.alert('Could not check for updates', e.message),
                )
              }
            />
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 35, gap: 10 }}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ height: 60, width: 60 }}
            />
            <Label style={{ fontWeight: '800', fontSize: 18 }}>
              Things to Do
            </Label>
            <Label muted style={{ fontSize: 12 }}>
              Version {native?.VERSION_NAME || '1.0.0'} · Old Alex Hub
            </Label>
            <Label muted style={{ fontSize: 11 }}>
              Free with advertising when enabled.
            </Label>
            <Label muted style={{ fontSize: 11 }}>
              info@oldalexhub.com
            </Label>
          </View>
        </View>
      </SafeScrollView>
    </AppShell>
  );
}
