export type DayOfWeek =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
  | 'Friday' | 'Saturday' | 'Sunday';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isPopular?: boolean;
  category?: string;
  imageUrl?: string | null;
};

export type WeeklyScheduleItem = {
  day: DayOfWeek;
  hours: string;
  isClosed?: boolean;
};

export type FoodTruck = {
  id: string;
  name: string;
  cuisine: string;
  cuisineTags?: string[];
  description: string;
  isOpen: boolean;
  distanceKm: number;
  locationName: string;
  latitude: number;
  longitude: number;
  todayHours: string;
  rating: number;
  reviewCount: number;
  menuItems: MenuItem[];
  weeklySchedule: WeeklyScheduleItem[];
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  activeStopId?: string | null;
  closingSoon?: boolean;
  isNewThisWeek?: boolean;
};
