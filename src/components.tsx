import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  ViewStyle,
  ScrollViewProps,
  TextInputProps,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  Compass,
  Heart,
  MapPin,
  ArrowRight,
  Trees,
  Utensils,
  Landmark,
  Ticket,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './theme';
import { useData } from './data';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLocal } from './storage';
import { BASE_URL } from './api';
import type { Activity, Photo } from './types';
export const spacing = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pad: { padding: 22 },
  section: { paddingHorizontal: 22, marginTop: 28 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  body: { fontSize: 15, lineHeight: 23 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '800' },
});
export function Label({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: any;
}) {
  const t = useTheme();
  const fontSize = StyleSheet.flatten(style)?.fontSize || 15;
  return (
    <Text
      style={[
        {
          color: muted ? t.muted : t.text,
          fontSize: 15,
          lineHeight: Math.ceil(fontSize * 1.35),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: secondary ? t.raised : t.teal,
          borderRadius: 16,
          paddingVertical: 15,
          paddingHorizontal: 18,
          minHeight: 50,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          color: secondary ? t.text : '#F8F6F0',
          fontWeight: '700',
          fontSize: 14,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 17,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: selected ? t.teal : t.surface,
        borderWidth: 1,
        borderColor: selected ? t.teal : t.line,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: selected ? '#fff' : t.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      {children}
    </SafeAreaView>
  );
}
export const SafeScrollView = React.forwardRef<React.ElementRef<typeof ScrollView>, ScrollViewProps>(function SafeScrollView(props, ref) {
  const inset = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      ref={ref}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { paddingBottom: Math.max(inset.bottom, 18) + 30 },
        props.contentContainerStyle,
      ]}
    />
  );
});
export function ScreenContainer({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SafeScrollView>{children}</SafeScrollView>
    </AppShell>
  );
}
export function SafeBottomBar({ children }: { children: React.ReactNode }) {
  const t = useTheme(),
    inset = useSafeAreaInsets();
  return (
    <View
      style={{
        padding: 18,
        paddingBottom: Math.max(inset.bottom, 18),
        backgroundColor: t.bg,
        borderTopWidth: 1,
        borderColor: t.line,
      }}
    >
      {children}
    </View>
  );
}
export function KeyboardSafeScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
        {children}
      </KeyboardAvoidingView>
    </AppShell>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 18, flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
      <Label muted style={{ fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        style={[
          {
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 14,
            backgroundColor: t.surface,
            padding: 14,
            color: t.text,
            minHeight: 50,
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Header({
  title,
  kicker,
  back = false,
  action,
}: {
  title: string;
  kicker?: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const t = useTheme(),
    nav = useNavigation();
  return (
    <View style={[spacing.between, { padding: 22 }]}>
      <View style={{ flex: 1 }}>
        {back && (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => nav.goBack()}
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <ChevronLeft color={t.text} />
          </Pressable>
        )}
        {kicker && (
          <Label style={[spacing.eyebrow, { color: t.gold, marginBottom: 8 }]}>
            {kicker}
          </Label>
        )}
        <Label style={spacing.title}>{title}</Label>
      </View>
      {action}
    </View>
  );
}
export function ExperienceIllustration({ activity }: { activity?: Activity }) {
  const { categories } = useData();
  const slugs = categories
    .filter(c => activity?.categories?.includes(c._id))
    .map(c => c.slug)
    .join(' ');
  const key = [slugs, ...(activity?.tags || [])].join(' ');
  const nature = /outdoor|nature|park/.test(key),
    food = /food|drink|cafe/.test(key),
    culture = /art|culture|history/.test(key);
  const color = nature
    ? '#176854'
    : food
    ? '#985B3D'
    : culture
    ? '#565393'
    : '#145F78';
  const bg = nature
    ? '#E3EFE4'
    : food
    ? '#FAE9D9'
    : culture
    ? '#ECE8F6'
    : '#DDEDF2';
  const title = nature
    ? 'A LITTLE FRESH AIR'
    : food
    ? 'FIND YOUR NEXT FAVORITE'
    : culture
    ? 'FOLLOW YOUR CURIOSITY'
    : 'SOMETHING WORTH EXPLORING';
  const Icon = nature ? Trees : food ? Utensils : culture ? Landmark : Ticket;
  return (
    <View
      accessibilityLabel="Category illustration"
      style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 180"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Circle cx="340" cy="30" r="85" fill={color} opacity={0.08} />
        <Circle cx="50" cy="190" r="120" fill={color} opacity={0.06} />
        <Path
          d="M-20 155 Q100 80 210 150 T440 110"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity={0.18}
        />
        <Path
          d="M-20 172 Q120 100 230 170 T440 130"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity={0.12}
        />
        <Circle cx="285" cy="45" r="5" fill="#E4AA50" />
        <Circle cx="97" cy="54" r="3" fill={color} opacity={0.4} />
      </Svg>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 22,
            backgroundColor: '#FFFFFF99',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={32} color={color} strokeWidth={1.5} />
        </View>
        <Text
          style={{ color, fontSize: 8, letterSpacing: 2, fontWeight: '700' }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
export function admissionLabel(a: Activity) {
  if (a.kind === 'hotel') return 'Check nightly rates';
  const p = a.priceInformation;
  if (!p?.known || typeof p.adult !== 'number') return 'Check admission';
  if (p.adult === 0) return 'Free admission';
  return `${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: p.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(p.adult)}${p.perGroup ? ' / group' : ' / adult'}`;
}
export function PhotoView({
  photo,
  style,
  children,
  decorative = false,
  activity,
}: {
  photo?: Photo;
  style?: ViewStyle;
  children?: React.ReactNode;
  decorative?: boolean;
  activity?: Activity;
}) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo?.url]);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: t.raised }, style]}>
      {photo?.url && !failed ? (
        <Image
          accessibilityLabel={photo.alt || 'Destination'}
          source={{
            uri: photo.url.startsWith('/') ? BASE_URL + photo.url : photo.url,
          }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      ) : decorative ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#155E75' }]}>
          <View
            style={{
              position: 'absolute',
              right: -60,
              top: -45,
              width: 270,
              height: 270,
              borderRadius: 150,
              backgroundColor: '#12B8A630',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: -90,
              bottom: -140,
              width: 420,
              height: 420,
              borderRadius: 210,
              borderWidth: 1,
              borderColor: '#F8F6F025',
            }}
          />
        </View>
      ) : (
        <ExperienceIllustration activity={activity} />
      )}
      {children}
    </View>
  );
}
export function Card({
  activity: a,
  onPress,
  wide = false,
  index = 0,
}: {
  activity: Activity;
  onPress: () => void;
  wide?: boolean;
  index?: number;
}) {
  const t = useTheme(),
    { state, toggleSave } = useLocal(),
    reduced = useReducedMotion();
  const saved = state.favorites.some(v => v._id === a._id);
  const price = admissionLabel(a);
  return (
    <Animated.View
      entering={
        reduced
          ? undefined
          : FadeInDown.duration(280).delay(Math.min(index, 5) * 35)
      }
      style={{ width: wide ? 270 : undefined, marginBottom: 18 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${a.title}`}
        onPress={onPress}
        style={{
          borderRadius: 22,
          backgroundColor: t.surface,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: t.line,
        }}
      >
        <PhotoView
          photo={a.images?.[0]}
          activity={a}
          style={{ height: a.images?.length ? (wide ? 170 : 190) : 140 }}
        >
          <View
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              backgroundColor: '#101827dd',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 7,
            }}
          >
            <Text
              style={{
                color: '#F8F6F0',
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1,
              }}
            >
              {a.kind === 'hotel' ? 'STAY' : a.priceInformation?.known ? price : a.startAt ? 'EVENT' : 'EXPLORE'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Unsave experience' : 'Save experience'}
            onPress={() => toggleSave(a)}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              width: 44,
              height: 44,
              borderRadius: 24,
              backgroundColor: '#101827c9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart
              size={20}
              color={saved ? '#FFB454' : '#fff'}
              fill={saved ? '#FFB454' : 'transparent'}
            />
          </Pressable>
        </PhotoView>
        <View style={{ padding: 17 }}>
          <Label style={{ fontSize: 19, fontWeight: '750', lineHeight: 25 }}>
            {a.title}
          </Label>
          <View style={[spacing.row, { marginTop: 8, gap: 6 }]}>
            <MapPin size={13} color={t.muted} />
            <Label muted style={{ fontSize: 12, flex: 1 }}>
              {a.location?.neighborhood ||
                a.location?.address ||
                'See location details'}
            </Label>
          </View>
          <Label muted style={{ fontSize: 12, marginTop: 10 }}>
            {price} ·{' '}
            {a.startAt
              ? new Date(a.startAt).toLocaleDateString('en-US',{timeZone:a.allDay?'UTC':a.timezone,month:'short',day:'numeric'})
              : a.estimatedDuration
              ? `${a.estimatedDuration.min}–${a.estimatedDuration.max} min`
              : 'View details'}
          </Label>
          {a.unavailable && (
            <Label style={{ color: t.gold }}>
              Saved information has expired
            </Label>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
export function Empty({
  title = 'A little room for discovery.',
  message,
  action,
  onAction,
}: {
  title?: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: 15 }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: t.raised,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Compass size={32} color={t.teal} />
      </View>
      <Label style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Label>
      <Label muted style={{ textAlign: 'center' }}>
        {message}
      </Label>
      {action && onAction && <Button title={action} onPress={onAction} />}
    </View>
  );
}
export function Loading({
  message = 'Finding your next good day…',
}: {
  message?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ padding: 35, gap: 18 }}>
      <ActivityIndicator color={t.teal} />
      <Label muted style={{ textAlign: 'center' }}>
        {message}
      </Label>
      {[0, 1].map(i => (
        <View
          key={i}
          style={{
            height: 160,
            borderRadius: 20,
            backgroundColor: t.surface,
            opacity: 0.7,
          }}
        />
      ))}
    </View>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.raised,
        padding: 14,
        borderRadius: 14,
        marginVertical: 10,
        flexDirection: 'row',
        gap: 10,
      }}
    >
      <AlertCircle size={17} color={t.gold} />
      <Label muted style={{ fontSize: 12, lineHeight: 19, flex: 1 }}>
        {children}
      </Label>
    </View>
  );
}
export async function openUrl(url?: string) {
  if (!url) return;
  try {
    if (!/^(https:\/\/|mailto:|geo:)/.test(url)) throw new Error();
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Could not open link',
      'Please try again with a browser or maps application installed.',
    );
  }
}
export function SectionHeading({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[spacing.between, { marginBottom: 18 }]}>
      <Label
        style={{
          fontSize: 23,
          fontWeight: '750',
          letterSpacing: -0.5,
          flex: 1,
        }}
      >
        {title}
      </Label>
      {onPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          onPress={onPress}
          style={{ padding: 10 }}
        >
          <ArrowRight color={t.teal} size={22} />
        </Pressable>
      )}
    </View>
  );
}
