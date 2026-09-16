import { supabase } from './supabase';
import type { FoodTruck, MenuItem, WeeklyScheduleItem, DayOfWeek } from '../types/truck';
import {
  getActiveScheduleStop,
  getValidScheduleStops,
  isScheduleStopActiveNow,
} from '../utils/schedule';

// Haversine formula — returns km between two lat/lng points
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function numberFromValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getValidCoordinates(latValue: unknown, lngValue: unknown) {
  const latitude = numberFromValue(latValue);
  const longitude = numberFromValue(lngValue);

  if (
    latitude === null ||
    longitude === null ||
    latitude === 0 ||
    longitude === 0 ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function isStopClosingSoon(stop: any, minutesWindow = 30): boolean {
  if (!isScheduleStopActiveNow(stop)) return false;
  const now = new Date();
  const [endH, endM] = stop.end_time.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return endMinutes - nowMinutes <= minutesWindow && endMinutes - nowMinutes > 0;
}

function mapDbTruckToFoodTruck(
  dbTruck: any,
  menuItems: any[],
  scheduleStops: any[],
  userLat?: number,
  userLng?: number
): FoodTruck {
  const truckStops = getValidScheduleStops(scheduleStops.filter((s) => s.truck_id === dbTruck.id));
  const activeStop = getActiveScheduleStop(truckStops);
  const fallbackStop = truckStops.find((s) => getValidCoordinates(s.latitude, s.longitude));

  const menu: MenuItem[] = menuItems
    .filter((m) => m.truck_id === dbTruck.id && m.is_available !== false)
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description || '',
      price: typeof m.price === 'number' ? m.price : parseFloat(m.price) || 0,
      isPopular: m.is_popular ?? false,
      category: m.category,
      imageUrl: m.image_url || null,
    }));

  const dayOrder: DayOfWeek[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  const stopsByDay: Record<string, any[]> = {};
  truckStops.forEach((s) => {
    if (!stopsByDay[s.day_of_week]) stopsByDay[s.day_of_week] = [];
    stopsByDay[s.day_of_week].push(s);
  });

  const weeklySchedule: WeeklyScheduleItem[] = dayOrder.map((day) => {
    const dayStops = stopsByDay[day];
    if (!dayStops || dayStops.length === 0) return { day, hours: 'Closed', isClosed: true };
    const enabled = dayStops.find((s) => s.is_enabled !== false) || dayStops[0];
    const hours = enabled ? `${enabled.start_time} – ${enabled.end_time}` : 'Closed';
    return { day, hours, isClosed: !enabled };
  });

  // A truck is only "open" if:
  //   1. The owner has marked it live (is_live = true)
  //   2. It is not suspended
  //   3. There is at least one schedule stop that is active RIGHT NOW
  //      (i.e. today's date/day, within the start–end time window, and enabled)
  // Without condition 3, trucks whose scheduled hours have ended will keep
  // showing as "online" on the customer UI until the owner manually flips is_live.
  const hasActiveStopNow = truckStops.some((s) => isScheduleStopActiveNow(s));
  const isOpen = dbTruck.is_live === true && dbTruck.status !== 'suspended' && hasActiveStopNow;
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) as DayOfWeek;
  const todayEntry = weeklySchedule.find((w) => w.day === today);
  const todayHours = todayEntry ? todayEntry.hours : 'Closed';

  const activeCoordinates = activeStop ? getValidCoordinates(activeStop.latitude, activeStop.longitude) : null;
  const fallbackCoordinates = fallbackStop ? getValidCoordinates(fallbackStop.latitude, fallbackStop.longitude) : null;
  const truckCoordinates = getValidCoordinates(dbTruck.latitude, dbTruck.longitude);
  const pinCoordinates = activeCoordinates || fallbackCoordinates || truckCoordinates;
  const lat = pinCoordinates?.latitude ?? 0;
  const lng = pinCoordinates?.longitude ?? 0;
  const locationName = activeStop?.location_name || dbTruck.current_location_name || '';
  const closingSoon = truckStops.some((s) => isStopClosingSoon(s));

  let distanceKm = 0;
  if (userLat != null && userLng != null && lat !== 0 && lng !== 0) {
    distanceKm = haversineKm(userLat, userLng, lat, lng);
  }

  return {
    id: dbTruck.id,
    name: dbTruck.name || 'Unnamed Truck',
    cuisine: Array.isArray(dbTruck.cuisine_tags)
      ? dbTruck.cuisine_tags[0] || 'Various'
      : typeof dbTruck.cuisine_tags === 'string'
      ? dbTruck.cuisine_tags.split(',')[0]?.trim() || 'Various'
      : 'Various',
    cuisineTags: Array.isArray(dbTruck.cuisine_tags) ? dbTruck.cuisine_tags : [],
    description: dbTruck.description || '',
    isOpen,
    distanceKm,
    locationName,
    latitude: lat,
    longitude: lng,
    todayHours,
    rating: dbTruck.rating ?? 0,
    reviewCount: dbTruck.review_count ?? 0,
    menuItems: menu,
    weeklySchedule,
    logoUrl: dbTruck.logo_url || null,
    coverUrl: dbTruck.cover_url || null,
    phone: dbTruck.phone || null,
    email: dbTruck.email || null,
    website: dbTruck.website || null,
    socialLinks: dbTruck.social_links || null,
    activeStopId: activeStop?.id || null,
    closingSoon,
    isNewThisWeek: dbTruck.created_at
      ? Date.now() - new Date(dbTruck.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      : false,
  };
}

/**
 * Fetches ONLY trucks that are currently ONLINE (is_live = true) and NOT suspended.
 * Offline and suspended trucks must never appear on the customer-facing map.
 */
export async function fetchTrucks(userLat?: number, userLng?: number): Promise<FoodTruck[]> {
  const [trucksRes, scheduleRes] = await Promise.all([
    supabase
      .from('trucks')
      .select(
        'id, name, cuisine_tags, description, is_live, status, logo_url, cover_url, created_at'
      )
      // Only live trucks — suspended already excluded by is_live being forced false
      .eq('is_live', true)
      .eq('profile_completed', true)
      // Belt-and-suspenders: also filter out suspended status explicitly
      .neq('status', 'suspended')
      .order('name', { ascending: true }),
    supabase
      .from('schedule_stops')
      .select('id, truck_id, is_enabled, repeat_weekly, date, day_of_week, start_time, end_time, latitude, longitude, location_name')
      .eq('is_enabled', true),
  ]);

  if (trucksRes.error) throw new Error(trucksRes.error.message);
  if (scheduleRes.error) throw new Error(scheduleRes.error.message);

  return (trucksRes.data || []).map((t) =>
    mapDbTruckToFoodTruck(t, [], scheduleRes.data || [], userLat, userLng)
  );
}

export async function fetchTruckById(truckId: string): Promise<FoodTruck | null> {
  const [truckRes, menuRes, scheduleRes] = await Promise.all([
    supabase
      .from('trucks')
      .select('id, name, cuisine_tags, description, is_live, status, logo_url, cover_url, created_at')
      .eq('id', truckId)
      .maybeSingle(),
    supabase
      .from('menu_items')
      .select('id, truck_id, name, description, price, is_popular, category, image_url, is_available')
      .eq('truck_id', truckId)
      .eq('is_available', true),
    supabase
      .from('schedule_stops')
      .select('id, truck_id, is_enabled, repeat_weekly, date, day_of_week, start_time, end_time, latitude, longitude, location_name')
      .eq('truck_id', truckId)
      .eq('is_enabled', true),
  ]);
  if (truckRes.error || !truckRes.data) return null;
  return mapDbTruckToFoodTruck(truckRes.data, menuRes.data || [], scheduleRes.data || []);
}
