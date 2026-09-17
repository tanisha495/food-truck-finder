# Food Truck Finder Mobile

Food Truck Finder is a React Native mobile application that helps users discover nearby food trucks, check their open status, view menus and schedules, save favorite trucks, and manage their profile and location settings.

The app is built as a customer-facing mobile experience for food truck discovery. It combines location services, map-based browsing, Supabase authentication, Supabase database queries, and reusable React Native UI components.

## Project Overview

Food trucks often change location and operating hours, which makes it difficult for customers to know where to find them. This app solves that problem by showing nearby active trucks on a map and giving users important details such as cuisine, schedule, menu, distance, and directions.

The main goal of the project is to make food truck discovery simple, location-aware, and mobile-friendly.

## Key Features

- User onboarding flow
- Location permission request and location status handling
- Email/password sign in and sign up with Supabase
- Session persistence using AsyncStorage
- Map-based food truck discovery
- Search by truck name, cuisine, and cuisine tags
- Distance and cuisine filters
- Open/closed status based on live status and schedule timing
- Truck detail page with description, schedule, menu, and directions
- Favorite trucks saved per authenticated user
- Alerts for new trucks, opening soon, and closing soon updates
- Profile page with avatar upload, edit name, password reset, and sign out
- Privacy and location settings screen
- Reusable components for buttons, inputs, cards, badges, and navigation

## Tech Stack

- React Native 0.86
- React 19
- TypeScript
- React Navigation
- Supabase Auth
- Supabase Database
- Supabase Storage
- React Native Maps
- React Native Geolocation
- React Native Image Picker
- AsyncStorage
- Jest

## How The App Works

1. The app starts from `App.tsx`.
2. `AppNavigator` defines the stack navigation and bottom tab navigation.
3. `SplashScreen` checks whether a Supabase auth session already exists.
4. If the user is logged in, the app opens the main tab navigator.
5. If the user is not logged in, the app shows onboarding, location permission, and authentication screens.
6. The main app tabs are Explore, Favorites, Alerts, and Profile.
7. Explore fetches food truck data, applies search/filter logic, and displays trucks on a map.
8. Truck Detail shows menu, schedule, favorite action, and directions.

## Core Business Logic

The most important logic is deciding whether a food truck should appear as open.

A truck is considered open only when:

- the truck is marked live
- the truck is not suspended
- the truck has a valid schedule stop
- the schedule stop is active for the current day/date and current time
- the truck has valid coordinates

This is better than relying only on an `is_live` flag, because a truck might still be marked live even after its scheduled hours have ended.

Distance filtering uses the Haversine formula to calculate the distance between the user's current latitude/longitude and the truck's latitude/longitude.

## Folder Structure

```text
src/
  components/
    cards/          Reusable card components
    common/         Shared UI components
    navigation/     Custom navigation UI
  constants/        Colors, spacing, typography, and theme values
  data/             Static sample/fallback data
  navigation/       App navigator, route types, and navigation helpers
  screens/          App screens
  services/         Supabase, auth, trucks, favorites, alerts, profile, and location logic
  store/            Local store utilities
  types/            Shared TypeScript types
  utils/            Schedule and open-status helpers
```

## Important Screens

- `SplashScreen` checks the auth session and decides the first route.
- `OnboardingScreen` introduces the app.
- `LocationPermissionScreen` asks for device location access.
- `SignInScreen` handles email/password login.
- `SignUpScreen` handles account creation.
- `ExploreScreen` shows nearby trucks on the map and handles search/filtering.
- `FiltersScreen` lets users select distance and cuisine filters.
- `TruckDetailScreen` shows menu, schedule, status, directions, and favorite action.
- `FavoritesScreen` shows the user's saved trucks.
- `AlertsScreen` shows stored and dynamic truck alerts.
- `ProfileScreen` manages account options and sign out.
- `PrivacyLocationScreen` shows location permission status and actions.

## Backend / Supabase Usage

The app uses Supabase for:

- authentication
- persisted user sessions
- profile data
- food truck data
- schedule stops
- menu items
- favorite trucks
- alerts
- avatar storage

Expected Supabase tables include:

- `profiles`
- `trucks`
- `schedule_stops`
- `menu_items`
- `favorite_trucks`
- `alerts`

The app also expects an `avatars` storage bucket for profile photos.

## Environment Variables

Create a local `.env` file in the project root.

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Do not commit the real `.env` file.

For GitHub, commit only a safe `.env.example` file with placeholder values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Security Notes

Do not commit:

- `.env`
- `.env.local`
- Android signing files such as `.jks` or `.keystore`
- `android/local.properties`
- private API keys
- Supabase service role keys

Only the Supabase anon key should be used in the mobile app. A Supabase service role key must never be placed in a client-side mobile application.

## Installation

Install JavaScript dependencies:

```sh
npm install
```

For iOS, install CocoaPods dependencies:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Running The App

Start Metro:

```sh
npm start
```

Run on Android:

```sh
npm run android
```

Run on iOS:

```sh
npm run ios
```

## Available Scripts

```sh
npm start        # Start Metro bundler
npm run android  # Build and run Android app
npm run ios      # Build and run iOS app
npm run lint     # Run ESLint
npm test         # Run Jest tests
```

## Known Limitations

- Google and Apple authentication buttons are placeholders.
- Password reset email is implemented, but full mobile deep-link recovery handling needs production testing.
- Push notifications are not fully implemented.
- Automated test coverage is currently limited.
- Realtime updates can be improved with Supabase realtime subscriptions.

## Future Improvements

- Add Google and Apple authentication
- Add push notifications for favorite trucks and closing-soon alerts
- Add Supabase realtime subscriptions for live truck status updates
- Add stronger offline support and no-location fallback behavior
- Add more tests for schedule logic, filtering, favorites, and auth flows
- Improve production release setup for Android and iOS

## Interview Summary

Food Truck Finder is a React Native and TypeScript mobile app that helps users find nearby food trucks. It uses Supabase for authentication, database access, and storage. The core feature is the Explore screen, where users can view nearby active trucks on a map, search and filter them, and open a detail page. The app uses schedule-aware logic so trucks are shown as open only when they are live and currently active according to their schedule.
