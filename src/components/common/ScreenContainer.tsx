import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../constants/theme';

type ScreenContainerProps = {
  children: ReactNode;
  centered?: boolean;
  padded?: boolean;
};

export default function ScreenContainer({
  children,
  centered = false,
  padded = true,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        centered ? styles.centered : undefined,
        padded ? styles.padded : undefined,
      ]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: theme.spacing.xl,
  },
});
