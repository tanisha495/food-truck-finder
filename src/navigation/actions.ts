import { CommonActions, type NavigationProp } from '@react-navigation/native';

import type { MainTabParamList, RootStackParamList } from './types';

type AppNavigation = NavigationProp<RootStackParamList>;

export function resetToStackScreen<RouteName extends keyof RootStackParamList>(
  navigation: AppNavigation,
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name, params }],
    })
  );
}

export function resetToMainTabs(
  navigation: AppNavigation,
  screen?: keyof MainTabParamList,
  params?: MainTabParamList[keyof MainTabParamList]
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: screen ? { screen, params } : undefined,
        },
      ],
    })
  );
}

export function goBackOrResetToMainTabs(navigation: AppNavigation, screen?: keyof MainTabParamList) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  resetToMainTabs(navigation, screen);
}
