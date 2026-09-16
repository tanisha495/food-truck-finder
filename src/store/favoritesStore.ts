import { useSyncExternalStore } from 'react';

let favoriteTruckIds: string[] = [];
const listeners = new Set<() => void>();

// TODO: Favorites can later be stored per user in Supabase.

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return favoriteTruckIds;
}

export function useFavoriteTruckIds() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function isFavoriteTruck(truckId: string) {
  return favoriteTruckIds.includes(truckId);
}

export function toggleFavoriteTruck(truckId: string) {
  if (isFavoriteTruck(truckId)) {
    favoriteTruckIds = favoriteTruckIds.filter((id) => id !== truckId);
  } else {
    favoriteTruckIds = [...favoriteTruckIds, truckId];
  }

  notifyListeners();
}

export function removeFavoriteTruck(truckId: string) {
  favoriteTruckIds = favoriteTruckIds.filter((id) => id !== truckId);
  notifyListeners();
}
