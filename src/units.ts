export type DistanceUnit = 'mi' | 'km';
export const KM_PER_MILE = 1.609344;
export function toKilometers(value: number, unit: DistanceUnit) {
  return unit === 'mi' ? value * KM_PER_MILE : value;
}
export function fromKilometers(value: number, unit: DistanceUnit) {
  return unit === 'mi' ? value / KM_PER_MILE : value;
}
export function distanceLabel(km: number, unit: DistanceUnit) {
  return `${fromKilometers(km, unit).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  })} ${unit}`;
}

export function localizeDistanceText(text: string, unit: DistanceUnit) {
  return text.replace(/(\d+(?:\.\d+)?) km\b/g, (_all, value: string) =>
    distanceLabel(Number(value), unit),
  );
}

export function timeLabel(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${
    hour >= 12 ? 'PM' : 'AM'
  }`;
}
