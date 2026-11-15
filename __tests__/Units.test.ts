import {
  distanceLabel,
  fromKilometers,
  toKilometers,
  localizeDistanceText,
} from '../src/units';
import { initialState, normalizeState } from '../src/storage';

test('US defaults and existing installations use miles, explicit kilometers survive migration', () => {
  expect(initialState.distanceUnit).toBe('mi');
  expect(normalizeState({}).distanceUnit).toBe('mi');
  expect(normalizeState({ distanceUnit: 'km' }).distanceUnit).toBe('km');
  expect(
    normalizeState(JSON.parse('{"distanceUnit":"invalid"}')).distanceUnit,
  ).toBe('mi');
});
test('display units never change the geographic radius sent to the API', () => {
  const radius = toKilometers(10, 'mi');
  expect(radius).toBeCloseTo(16.09344);
  expect(fromKilometers(radius, 'mi')).toBeCloseTo(10);
  expect(toKilometers(radius, 'km')).toBe(radius);
  expect(distanceLabel(radius, 'mi')).toBe('10 mi');
  expect(distanceLabel(radius, 'km')).toBe('16.1 km');
});
test('plan explanations follow the selected distance unit', () => {
  expect(
    localizeDistanceText('About 16.1 km from your starting point', 'mi'),
  ).toBe('About 10 mi from your starting point');
  expect(
    localizeDistanceText('About 16.1 km from your starting point', 'km'),
  ).toContain('16.1 km');
});
