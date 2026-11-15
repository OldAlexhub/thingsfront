export type Photo = {
  url: string;
  alt?: string;
  credit?: string;
  license?: string;
  sourceUrl?: string;
};
export type City = {
  _id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  description: string;
  heroImage?: Photo;
  gallery?: Photo[];
  theme?: { accent: string; background: string };
  planTemplates?: {
    key: string;
    title: string;
    description?: string;
    defaults: Partial<
      Pick<
        PlanInput,
        | 'startTime'
        | 'endTime'
        | 'budget'
        | 'strictBudget'
        | 'transport'
        | 'environment'
        | 'weather'
        | 'pace'
        | 'meals'
        | 'radiusKm'
        | 'interests'
      >
    >;
  }[];
  map?: { tileUrl: string; attribution: string };
};
export type Category = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  parentId?: string;
  kind: string;
};
export type Activity = {
  _id: string;
  cityId: string;
  title: string;
  description?: string;
  shortDescription?: string;
  categories: string[];
  tags: string[];
  audience: string[];
  images: Photo[];
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  location?: { address?: string; neighborhood?: string };
  priceInformation?: {
    known: boolean;
    adult?: number;
    child?: number;
    childBands?: { minAge: number; maxAge: number; amount: number }[];
    perGroup?: boolean;
    currency: string;
    note?: string;
  };
  estimatedDuration?: { min: number; max: number };
  operatingHours?: {
    verified: boolean;
    timezone: string;
    validUntil: string;
    weekly: { day: number; open: string; close: string }[];
  };
  source: string;
  sourceUrl?: string;
  officialWebsite?: string;
  bookingUrl?: string;
  verificationStatus?: string;
  lastSyncedAt?: string;
  lastVerifiedAt?: string;
  expiresAt?: string;
  environment?: string;
  accessibility?: string;
  parking?: string;
  reservationRequired?: boolean;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  eventStatus?: string;
  venue?: string;
  unavailable?: boolean;
};
export type PlanInput = {
  cityId: string;
  date: string;
  startTime: string;
  endTime: string;
  budget: number;
  strictBudget: boolean;
  adults: number;
  childAges: number[];
  start?: [number, number];
  transport: 'walking' | 'cycling' | 'driving' | 'transit';
  interests: string[];
  environment: 'any' | 'indoor' | 'outdoor';
  pace: 'relaxed' | 'balanced' | 'active';
  meals: boolean;
  radiusKm: number;
  mode: 'local' | 'tourist';
  weather?: 'any' | 'dry' | 'rain' | 'heat' | 'cold';
  visited: string[];
  exclude: string[];
  stopIds?: string[];
};
export type Stop = {
  activity: Activity;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  travel: { minutes: number; distanceKm: number; kind: string };
  groupCost: number | null;
  reasons: string[];
  warnings: string[];
};
export type Plan = {
  id?: string;
  name?: string;
  cityName: string;
  timezone: string;
  date: string;
  input: PlanInput;
  stops: Stop[];
  breaks: { type: string; startTime: string; endTime: string; note: string }[];
  knownAdmissionTotal: number;
  remainingAdmissionBudget: number;
  unknownCostCount: number;
  warnings: string[];
  generatedAt: string;
};
export type Home = {
  city: City;
  sections: { key: string; title: string; type: string; items: Activity[] }[];
};
export type RootStackParams = {
  Main: undefined;
  Detail: { activity: Activity };
  CityPicker: undefined;
  Itinerary: { plan: Plan };
  Map: { activities: Activity[]; title?: string };
  Legal: { kind: 'privacy' | 'terms' };
};
