export type AlertType =
  | 'new_truck'
  | 'truck_removed'
  | 'opening_soon'
  | 'truck_open'
  | 'closing_soon'
  | 'nearby';

export type FoodTruckAlert = {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  timeLabel: string;
  icon: string;
  relatedTruckId?: string;
  isRead?: boolean;
};
