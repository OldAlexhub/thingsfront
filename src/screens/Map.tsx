import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../api';
import { useData } from '../data';
import { useTheme } from '../theme';
import { AppShell, Header, Empty, Notice } from '../components';
import type { Activity } from '../types';
// Only JSON data crosses the bridge. Text goes into textContent in the map page.
export function ExperienceMap({
  activities,
  onSelect,
}: {
  activities: Activity[];
  onSelect: (a: Activity) => void;
}) {
  const { city } = useData(),
    t = useTheme(),
    [error, setError] = useState(false);
  const payload = useMemo(
    () =>
      JSON.stringify({
        center: [city?.latitude || 0, city?.longitude || 0],
        tileUrl:
          city?.map?.tileUrl ||
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: city?.map?.attribution || 'OpenStreetMap contributors',
        items: activities
          .filter(a => a.coordinates)
          .map(a => ({
            id: a._id,
            title: a.title,
            lat: a.coordinates!.coordinates[1],
            lon: a.coordinates!.coordinates[0],
          })),
      }),
    [activities, city],
  );
  const webview = useRef<WebView<object>>(null);
  const script = `window.setExperiences && window.setExperiences(${payload});true;`;
  useEffect(() => {
    webview.current?.injectJavaScript(script);
  }, [script]);
  if (error)
    return (
      <Empty
        title="The map is taking a break."
        message="Map tiles need an internet connection. Your list and saved plans are still available."
        action="Try again"
        onAction={() => setError(false)}
      />
    );
  return (
    <View style={{ flex: 1, minHeight: 300, backgroundColor: t.surface }}>
      <WebView<object>
        ref={webview}
        source={{ uri: BASE_URL + '/map.html' }}
        userAgent="ThingsToDo/1.0 (Android; Old Alex Hub; info@oldalexhub.com)"
        originWhitelist={[BASE_URL]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        mixedContentMode="never"
        allowFileAccess={false}
        setSupportMultipleWindows={false}
        injectedJavaScript={script}
        onMessage={event => {
          try {
            const value = JSON.parse(event.nativeEvent.data);
            const a = activities.find(item => item._id === value.id);
            if (a) onSelect(a);
          } catch {
            /* Ignore invalid messages. */
          }
        }}
        onError={() => setError(true)}
        onHttpError={() => setError(true)}
        onShouldStartLoadWithRequest={request =>
          request.url === BASE_URL + '/map.html' ||
          request.url === 'about:blank'
        }
      />
      {!activities.length && (
        <View style={{ position: 'absolute', left: 20, right: 20, top: 20 }}>
          <Notice>No matching locations to show yet.</Notice>
        </View>
      )}
    </View>
  );
}
export function MapScreen() {
  const route = useRoute<any>(),
    nav = useNavigation<any>(),
    inset = useSafeAreaInsets();
  return (
    <AppShell>
      <Header
        back
        title={route.params.title || 'A different point of view.'}
        kicker="EXPLORE THE MAP"
      />
      <View style={{ flex: 1, paddingBottom: inset.bottom }}>
        <ExperienceMap
          activities={route.params.activities}
          onSelect={activity => nav.navigate('Detail', { activity })}
        />
      </View>
    </AppShell>
  );
}
