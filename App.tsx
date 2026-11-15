import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  Animated,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Compass,
  Search,
  Route,
  Bookmark,
  SlidersHorizontal,
} from 'lucide-react-native';
import { LocalProvider, useLocal } from './src/storage';
import { DataProvider } from './src/data';
import { useTheme } from './src/theme';
import { AdsProvider } from './src/ads';
import { api, native } from './src/api';
import { DiscoverScreen, CityPickerScreen } from './src/screens/Discover';
import { ExploreScreen } from './src/screens/Explore';
import { PlannerScreen } from './src/screens/Planner';
import { SavedScreen } from './src/screens/Saved';
import { SettingsScreen } from './src/screens/Settings';
import { DetailScreen } from './src/screens/Detail';
import { ItineraryScreen } from './src/screens/Itinerary';
import { MapScreen } from './src/screens/Map';
import { LegalScreen } from './src/screens/Legal';
import type { RootStackParams } from './src/types';
const Stack = createNativeStackNavigator<RootStackParams>(),
  Tabs = createBottomTabNavigator();
function TabNavigator() {
  const t = useTheme(),
    insets = useSafeAreaInsets();
  const icons: Record<string, typeof Compass> = {
    Discover: Compass,
    Explore: Search,
    Plan: Route,
    Saved: Bookmark,
    Settings: SlidersHorizontal,
  };
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: t.teal,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopColor: t.line,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4 },
        tabBarIcon: ({ color, size }) => {
          const Icon = icons[route.name];
          return <Icon color={color} size={size - 2} strokeWidth={1.8} />;
        },
      })}
    >
      <Tabs.Screen name="Discover" component={DiscoverScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen
        name="Plan"
        component={PlannerScreen}
        options={{ title: 'Plan My Day', tabBarLabel: 'Plan', tabBarAccessibilityLabel: 'Plan My Day' }}
      />
      <Tabs.Screen name="Saved" component={SavedScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <View
        style={{
          flex: 1,
          backgroundColor: '#101827',
          padding: 40,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#F8F6F0', fontSize: 26, fontWeight: '700' }}>
          Let’s try that again.
        </Text>
        <Text style={{ color: '#A6B6C7', marginVertical: 20 }}>
          Your saved plans are still on this device.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => this.setState({ failed: false })}
          style={{ color: '#12B8A6', paddingVertical: 20 }}
        >
          Reload the app
        </Text>
      </View>
    ) : (
      this.props.children
    );
  }
}
function Root() {
  const t = useTheme(),
    { ready } = useLocal(),
    [intro, setIntro] = useState(true),
    [reduced, setReduced] = useState<boolean | null>(null),
    opacity = useRef(new Animated.Value(1)).current,
    scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const s = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => s.remove();
  }, []);
  useEffect(() => {
    if (ready && reduced !== null) {
      if (reduced) {
        setIntro(false);
        return;
      }
      const introAnimation = Animated.sequence([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.04,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
      ]);
      introAnimation.start(() => setIntro(false));
      return () => introAnimation.stop();
    }
  }, [ready, reduced, opacity, scale]);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    api<{
      updateAvailable: boolean;
      updateRequired: boolean;
      releaseNotes: string[];
    }>(
      '/app/version?currentVersionCode=' + (native?.VERSION_CODE || 1),
      undefined,
      false,
    )
      .then(r => {
        if (alive && r.data.updateAvailable)
          Alert.alert(
            r.data.updateRequired
              ? 'An important update is available'
              : 'A fresh version is on its way',
            r.data.releaseNotes.join('\n') ||
              'Check Google Play for an available update.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Check Google Play',
                onPress: () =>
                  native
                    .checkForUpdate(r.data.updateRequired)
                    .then(result => {
                      if (result !== 'started')
                        Alert.alert(
                          'Update unavailable',
                          'Google Play has no installable update for this device yet.',
                        );
                    })
                    .catch(() =>
                      Alert.alert(
                        'Could not start update',
                        'Check Google Play when online.',
                      ),
                    ),
              },
            ],
          );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready]);
  const base = t.bg === '#101827' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: t.bg,
      card: t.surface,
      text: t.text,
      primary: t.teal,
      border: t.line,
    },
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar
        barStyle={t.bg === '#101827' ? 'light-content' : 'dark-content'}
      />
      {ready && (
        <DataProvider>
          <AdsProvider>
            <NavigationContainer theme={theme}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: reduced ? 'none' : 'slide_from_right',
                  contentStyle: { backgroundColor: t.bg },
                }}
              >
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Detail" component={DetailScreen} />
                <Stack.Screen
                  name="CityPicker"
                  component={CityPickerScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen name="Itinerary" component={ItineraryScreen} />
                <Stack.Screen name="Map" component={MapScreen} />
                <Stack.Screen name="Legal" component={LegalScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AdsProvider>
        </DataProvider>
      )}
      {intro && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#101827',
            alignItems: 'center',
            justifyContent: 'center',
            opacity,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: 160,
              borderWidth: 1,
              borderColor: '#12B8A624',
              transform: [{ translateY: -30 }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 420,
              height: 420,
              borderRadius: 210,
              borderWidth: 1,
              borderColor: '#12B8A612',
              transform: [{ translateY: -30 }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: '#12B8A60C',
              transform: [{ translateY: -80 }],
            }}
          />
          <Animated.Image
            source={require('./assets/logo.png')}
            style={{ width: 150, height: 150, transform: [{ scale }] }}
          />
          <Text
            style={{
              fontSize: 34,
              fontWeight: '800',
              color: '#F8F6F0',
              marginTop: 20,
            }}
          >
            Things to Do
          </Text>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 2,
              color: '#FFB454',
              marginTop: 16,
            }}
          >
            Discover. Explore. Experience.
          </Text>
          <Text
            style={{
              position: 'absolute',
              bottom: 70,
              color: '#A6B6C7',
              fontSize: 10,
              letterSpacing: 3,
            }}
          >
            OLD ALEX HUB
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LocalProvider>
            <Root />
          </LocalProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
