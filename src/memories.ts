import type { Activity } from './types';
export type Visit = {
  activityId: string;
  activity: Activity;
  placeTitle: string;
  cityName: string;
  visitedOn: string;
  name: string;
  note: string;
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function memoryCaption(visit: Pick<Visit,'name'|'placeTitle'|'cityName'|'visitedOn'|'note'>) {
  return [
    `${visit.name.trim() || 'I'} was here!`,
    [visit.placeTitle,visit.cityName].filter(Boolean).join(' · '),
    visit.visitedOn,visit.note.trim(),'#old_alex_hub',
    'Made with Things to Do by Old Alex Hub',
  ].filter(Boolean).join('\n');
}
