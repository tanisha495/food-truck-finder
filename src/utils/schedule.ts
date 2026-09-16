export type ScheduleStopLike = {
  date?: string | null;
  day_of_week?: string | null;
  end_time?: string | null;
  is_enabled?: boolean | null;
  repeat_weekly?: boolean | null;
  start_time?: string | null;
};

function parseLocalDate(value: string | null | undefined) {
  if (!value) return null;

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function minutesFromScheduleTime(value: string | null | undefined) {
  if (!value) return null;

  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

export function isScheduleStopToday(stop: ScheduleStopLike, now = new Date()) {
  if (stop.repeat_weekly === true) {
    const dayOfWeek = typeof stop.day_of_week === 'string' ? stop.day_of_week.trim() : '';
    if (!dayOfWeek) return false;

    return dayOfWeek === new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  }

  const stopDate = parseLocalDate(stop.date);
  if (!stopDate) return false;

  return startOfLocalDay(stopDate).getTime() === startOfLocalDay(now).getTime();
}

export function isScheduleStopVisible(stop: ScheduleStopLike, now = new Date()) {
  if (stop.is_enabled !== true) return false;

  // Weekly stops are recurring schedules. Keep them visible even when an old
  // date value is present; day_of_week determines when they apply.
  if (stop.repeat_weekly === true) return true;

  const stopDate = parseLocalDate(stop.date);
  if (!stopDate) return false;

  const stopDay = startOfLocalDay(stopDate).getTime();
  const today = startOfLocalDay(now).getTime();

  if (stopDay < today) return false;
  if (stopDay > today) return true;

  const endMinutes = minutesFromScheduleTime(stop.end_time);
  if (endMinutes === null) return true;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return endMinutes >= nowMinutes;
}

export function getValidScheduleStops<T extends ScheduleStopLike>(stops: T[], now = new Date()) {
  return stops.filter((stop) => isScheduleStopVisible(stop, now));
}

export function isScheduleStopActiveNow(stop: ScheduleStopLike, now = new Date()) {
  if (!isScheduleStopVisible(stop, now) || !isScheduleStopToday(stop, now)) return false;

  const startMinutes = minutesFromScheduleTime(stop.start_time);
  const endMinutes = minutesFromScheduleTime(stop.end_time);
  if (startMinutes === null || endMinutes === null) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

export function getActiveScheduleStop<T extends ScheduleStopLike>(stops: T[], now = new Date()) {
  return stops.find((stop) => isScheduleStopActiveNow(stop, now));
}
