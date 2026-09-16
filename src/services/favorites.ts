import { supabase } from './supabase';
import { getActiveScheduleStop, getValidScheduleStops } from '../utils/schedule';

type FavoriteRow = {
  id?: string | null;
  truck_id: string | null;
};

type TruckRow = Record<string, unknown> & {
  id: string;
  name?: string | null;
  cover_url?: string | null;
  logo_url?: string | null;
  cuisine_tags?: unknown;
  status?: string | null;
  is_live?: boolean | null;
};

type ScheduleStopRow = Record<string, unknown> & {
  truck_id?: string | null;
  day_of_week?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_enabled?: boolean | null;
  repeat_weekly?: boolean | null;
};

export type FavoriteTruck = {
  id: string;
  name: string;
  imageUrl: string | null;
  cuisine: string;
  distanceLabel: string;
  isOpen: boolean;
  statusLabel: string;
};

export type FavoriteTrucksResult = {
  isLoggedIn: boolean;
  trucks: FavoriteTruck[];
};

const CLOSED_STATUSES = new Set(['closed', 'offline', 'suspended', 'inactive']);
const OPEN_STATUSES = new Set(['open', 'online', 'live', 'active']);

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  return data.user?.id ?? null;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized.length > 0) return normalized;
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return toStringArray(parsed);
      } catch {
        return [];
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function formatDistanceLabel(truck: TruckRow) {
  const miles =
    Number(truck.distance_miles) ||
    Number(truck.distance_mi) ||
    Number(truck.distance);

  if (Number.isFinite(miles) && miles > 0) {
    return `${miles.toFixed(1)} mi`;
  }

  const kilometers = Number(truck.distance_km);
  if (Number.isFinite(kilometers) && kilometers > 0) {
    return `${(kilometers * 0.621371).toFixed(1)} mi`;
  }

  return 'Nearby';
}

function minutesFromTime(value: string | null | undefined) {
  if (!value) return null;

  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

function formatTimeLabel(value: string | null | undefined) {
  const minutes = minutesFromTime(value);
  if (minutes === null) return null;

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minuteLabel = mins > 0 ? `:${String(mins).padStart(2, '0')}` : '';

  return `${hours12}${minuteLabel} ${period}`;
}

function mapTruckRow(truck: TruckRow, scheduleStops: ScheduleStopRow[]): FavoriteTruck {
  const status = normalizeString(truck.status).toLowerCase();
  const isClosedByStatus = CLOSED_STATUSES.has(status);
  const isOpenByStatus = OPEN_STATUSES.has(status);
  const activeStop = getActiveScheduleStop(scheduleStops);
  const isOpen = !isClosedByStatus && (truck.is_live === true || isOpenByStatus) && Boolean(activeStop);
  const closingTime = formatTimeLabel(activeStop?.end_time);
  const cuisines = toStringArray(truck.cuisine_tags);

  return {
    id: truck.id,
    name: firstNonEmptyString(truck.name) ?? 'Unnamed Truck',
    imageUrl: firstNonEmptyString(truck.cover_url, truck.logo_url),
    cuisine: cuisines[0] ?? 'Food Truck',
    distanceLabel: formatDistanceLabel(truck),
    isOpen,
    statusLabel: isOpen && closingTime ? `Open until ${closingTime}` : isOpen ? 'Open' : 'Closed',
  };
}

export async function getFavoriteTruckIds(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('favorite_trucks')
    .select('truck_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Favorite ids load failed', error);
    throw new Error(error.message);
  }

  return ((data ?? []) as FavoriteRow[])
    .map((favorite) => favorite.truck_id)
    .filter((truckId): truckId is string => Boolean(truckId));
}

export async function isFavoriteTruck(truckId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from('favorite_trucks')
    .select('id')
    .eq('user_id', userId)
    .eq('truck_id', truckId)
    .limit(1);

  if (error) {
    console.error('Favorite check failed', error);
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

export async function addFavoriteTruck(truckId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Please sign in to save favorites.');

  const { data: existingRows, error: existingError } = await supabase
    .from('favorite_trucks')
    .select('id')
    .eq('user_id', userId)
    .eq('truck_id', truckId)
    .limit(1);

  if (existingError) {
    console.error('Favorite add check failed', existingError);
    throw new Error(existingError.message);
  }

  if ((existingRows ?? []).length > 0) return;

  const { error } = await supabase
    .from('favorite_trucks')
    .insert({ user_id: userId, truck_id: truckId })
    .select('id, user_id, truck_id')
    .single();

  if (error) {
    console.error('Favorite add failed', error);
    throw new Error(error.message);
  }
}

export async function removeFavoriteTruck(truckId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Please sign in to update favorites.');

  const { error } = await supabase
    .from('favorite_trucks')
    .delete()
    .eq('user_id', userId)
    .eq('truck_id', truckId);

  if (error) {
    console.error('Favorite remove failed', error);
    throw new Error(error.message);
  }
}

export async function getFavoriteTrucks(): Promise<FavoriteTrucksResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { isLoggedIn: false, trucks: [] };

  const { data: favoriteRows, error: favoritesError } = await supabase
    .from('favorite_trucks')
    .select('truck_id')
    .eq('user_id', userId);

  if (favoritesError) {
    console.error('Favorite rows load failed', favoritesError);
    throw new Error(favoritesError.message);
  }

  const favoriteIds = ((favoriteRows ?? []) as FavoriteRow[])
    .map((favorite) => favorite.truck_id)
    .filter((truckId): truckId is string => Boolean(truckId));

  if (favoriteIds.length === 0) return { isLoggedIn: true, trucks: [] };

  const { data: truckRows, error: trucksError } = await supabase
    .from('trucks')
    .select('id, name, cover_url, logo_url, cuisine_tags, status, is_live')
    .in('id', favoriteIds);

  if (trucksError) {
    console.error('Favorite trucks fetch failed', trucksError);
    throw new Error(trucksError.message);
  }

  const trucks = (truckRows ?? []) as TruckRow[];
  const existingTruckIds = new Set(trucks.map((truck) => truck.id));
  const missingTruckIds = favoriteIds.filter((truckId) => !existingTruckIds.has(truckId));

  if (missingTruckIds.length > 0) {
    await supabase
      .from('favorite_trucks')
      .delete()
      .eq('user_id', userId)
      .in('truck_id', missingTruckIds);
  }

  if (trucks.length === 0) return { isLoggedIn: true, trucks: [] };

  const { data: scheduleRows } = await supabase
    .from('schedule_stops')
    .select('id, truck_id, day_of_week, date, start_time, end_time, is_enabled, repeat_weekly')
    .eq('is_enabled', true)
    .in('truck_id', trucks.map((truck) => truck.id));

  const scheduleStops = getValidScheduleStops((scheduleRows ?? []) as ScheduleStopRow[]);
  const scheduleByTruckId = new Map<string, ScheduleStopRow[]>();

  scheduleStops.forEach((stop) => {
    const truckId = stop.truck_id;
    if (!truckId) return;

    const stops = scheduleByTruckId.get(truckId) ?? [];
    stops.push(stop);
    scheduleByTruckId.set(truckId, stops);
  });

  const mappedTrucks = favoriteIds
    .map((truckId) => trucks.find((truck) => truck.id === truckId))
    .filter((truck): truck is TruckRow => Boolean(truck))
    .map((truck) => mapTruckRow(truck, scheduleByTruckId.get(truck.id) ?? []));

  return { isLoggedIn: true, trucks: mappedTrucks };
}
