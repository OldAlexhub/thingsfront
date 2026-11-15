import type { Activity, Plan } from './types';

function point(a: Activity, city: string): string {
  const c = a.coordinates?.coordinates;
  if (c?.length === 2 && c.every(Number.isFinite) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90)
    return `${c[1]},${c[0]}`;
  const parts=Array.from([a.title, a.location?.address, city].filter(Boolean).join(', '));
  while(encodeURIComponent(parts.join('')).length>300)parts.pop();
  return parts.join('');
}
export type MapsPart = { title: string; url: string };
// Three intermediate stops is the mobile browser limit. Never drop later stops.
// Transit is opened one leg at a time because multi-stop transit isn't supported.
export function googleMapsParts(plan: Plan): MapsPart[] {
  const places = plan.stops.map(s => point(s.activity, plan.cityName));
  const chunk = plan.input.transport === 'transit' ? 1 : 4;
  const mode = plan.input.transport === 'cycling' ? 'bicycling' : plan.input.transport;
  const parts: MapsPart[] = [];
  for (let i = 0; i < places.length; i += chunk) {
    const segment = places.slice(i, i + chunk);
    const start = plan.input.start;
    const origin = i ? places[i - 1] : start ? `${start[1]},${start[0]}` : undefined;
    const parameters: Record<string, string | undefined> = {
      api: '1', origin, destination: segment[segment.length - 1],
      waypoints: segment.length > 1 ? segment.slice(0, -1).join('|') : undefined,
      travelmode: mode,
    };
    parts.push({
      title: chunk === 1 ? `Stop ${i + 1}: ${plan.stops[i].activity.title}` : `Stops ${i + 1}–${i + segment.length}`,
      url: 'https://www.google.com/maps/dir/?' + Object.entries(parameters)
        .filter(([,value]) => value !== undefined)
        .map(([key,value]) => `${key}=${encodeURIComponent(value!)}`).join('&'),
    });
  }
  return parts;
}
