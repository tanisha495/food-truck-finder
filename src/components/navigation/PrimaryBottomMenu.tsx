import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../constants/theme';
import { resetToMainTabs } from '../../navigation/actions';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import BottomTabIcon, { type BottomTabIconName } from './BottomTabIcon';
import { bottomTabColors } from './bottomTabColors';

type PrimaryTab = 'explore' | 'favorites' | 'alerts' | 'profile';

type MenuItem = {
  icon: BottomTabIconName;
  key: PrimaryTab;
  label: string;
  screen: keyof MainTabParamList;
};

const menuItems: MenuItem[] = [
  {
    icon: 'explore',
    key: 'explore',
    label: 'Explore',
    screen: 'Explore',
  },
  {
    icon: 'favorites',
    key: 'favorites',
    label: 'Favorites',
    screen: 'Favorites',
  },
  {
    icon: 'alerts',
    key: 'alerts',
    label: 'Alerts',
    screen: 'Alerts',
  },
  {
    icon: 'profile',
    key: 'profile',
    label: 'Profile',
    screen: 'Profile',
  },
];

type PrimaryBottomMenuProps = {
  activeTab?: PrimaryTab;
};

export default function PrimaryBottomMenu({ activeTab }: PrimaryBottomMenuProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const currentTab = activeTab ?? 'explore';

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = item.key === currentTab;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.key}
              onPress={() => resetToMainTabs(navigation, item.screen)}
              style={styles.item}>
              <BottomTabIcon focused={isActive} name={item.icon} />
              <Text style={[styles.label, isActive ? styles.activeLabel : undefined]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeLabel: {
    color: bottomTabColors.active,
    fontWeight: '700',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minWidth: 0,
  },
  label: {
    ...theme.typography.bodySmall,
    color: bottomTabColors.inactive,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    textAlign: 'center',
  },
  menu: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 72,
    paddingBottom: 8,
    paddingTop: 7,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
