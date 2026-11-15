// Draggable FlatList 4 still imports the Gesture Handler 2 component names.
// Scope these aliases to that dependency; the app uses Gesture Handler 3.
export * from 'react-native-gesture-handler';
export {
  LegacyFlatList as FlatList,
  LegacyScrollView as ScrollView,
} from 'react-native-gesture-handler';
