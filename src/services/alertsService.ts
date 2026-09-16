import { supabase } from './supabase';
import type { FoodTruckAlert } from '../types/alert';
import {
  isScheduleStopActiveNow,
  isScheduleStopToday,
  isScheduleStopVisible,
  minutesFromScheduleTime,
} from '../utils/schedule';

// Fetch real alerts from Supabase alerts table (if it exists),
// and also dynamically generate closing-soon / new-truck alerts from live data.
export async function fetchAlerts(): Promise<FoodTruckAlert[]> {
  const alerts: FoodTruckAlert[] = [];

  // 1. Fetch stored alerts from DB (new_truck, truck_removed, etc.)
  try {
    const { data: dbAlerts } = await supabase
      .from('alerts')
      .select('id, type, title, message, created_at, truck_id, is_read')
      .order('created_at', { ascending: false })
      .limit(30);

    if (dbAlerts && dbAlerts.length > 0) {
      dbAlerts.forEach((a: any) => {
        alerts.push({
          id: a.id,
          type: a.type,
          title: a.title,
          message: a.message || '',
          timeLabel: formatTimeLabel(a.created_at),
          icon: getAlertIcon(a.type),
          relatedTruckId: a.truck_id || undefined,
          isRead: a.is_read ?? false,
        });
      });
    }
  } catch {
    // alerts table may not exist yet — skip
  }

  // 2. Generate closing-soon alerts from live schedule_stops
  try {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const { data: stops } = await supabase
      .from('schedule_stops')
      .select('id, truck_id, day_of_week, date, start_time, end_time, location_name, is_enabled, repeat_weekly, trucks(id, name)')
      .eq('is_enabled', true);

    (stops || []).forEach((stop: any) => {
      if (!isScheduleStopVisible(stop, now) || !isScheduleStopToday(stop, now)) return;

      const endMin = minutesFromScheduleTime(stop.end_time);
      const startMin = minutesFromScheduleTime(stop.start_time);
      if (endMin === null || startMin === null) return;

      // Active right now
      if (isScheduleStopActiveNow(stop, now)) {
        const remaining = endMin - nowMin;
        // Closing soon (within 30 min)
        if (remaining <= 30 && remaining > 0) {
          const truckName = stop.trucks?.name || 'A food truck';
          alerts.push({
            id: `closing-${stop.id}`,
            type: 'closing_soon',
            title: `${truckName} is closing soon`,
            message: `Last chance — closing in ${remaining} minutes at ${stop.location_name}.`,
            timeLabel: 'Now',
            icon: '⏰',
            relatedTruckId: stop.truck_id,
            isRead: false,
          });
        }
      }

      // Opening in the next 30 min
      if (startMin > nowMin && startMin - nowMin <= 30) {
        const truckName = stop.trucks?.name || 'A food truck';
        alerts.push({
          id: `opening-${stop.id}`,
          type: 'truck_open',
          title: `${truckName} is opening soon`,
          message: `Opening in ~${startMin - nowMin} minutes at ${stop.location_name}.`,
          timeLabel: 'Coming up',
          icon: '🚚',
          relatedTruckId: stop.truck_id,
          isRead: false,
        });
      }
    });
  } catch {}

  // 3. New trucks this week
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newTrucks } = await supabase
      .from('trucks')
      .select('id, name, cuisine_tags, created_at')
      .neq('status', 'suspended')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false });

    (newTrucks || []).forEach((t: any) => {
      const cuisine = Array.isArray(t.cuisine_tags) ? t.cuisine_tags[0] : (t.cuisine_tags || 'food');
      alerts.push({
        id: `new-${t.id}`,
        type: 'new_truck',
        title: `New truck: ${t.name}`,
        message: `${t.name} just joined — serving ${cuisine}. Check them out!`,
        timeLabel: formatTimeLabel(t.created_at),
        icon: '✨',
        relatedTruckId: t.id,
        isRead: false,
      });
    });
  } catch {}

  // Deduplicate by id, most recent first
  const seen = new Set<string>();
  return alerts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

function formatTimeLabel(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  return `${diffD} days ago`;
}

function getAlertIcon(type: string): string {
  const icons: Record<string, string> = {
    new_truck: '✨',
    truck_removed: '⚠️',
    closing_soon: '⏰',
    truck_open: '🚚',
    opening_soon: '🚚',
    nearby: '🔔',
  };
  return icons[type] || '🔔';
}
