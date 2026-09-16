import { StyleSheet, Text, View } from 'react-native';

import { bottomTabColors } from './bottomTabColors';

export type BottomTabIconName = 'explore' | 'favorites' | 'alerts' | 'profile';

export { bottomTabColors } from './bottomTabColors';

type BottomTabIconProps = {
  focused?: boolean;
  name: BottomTabIconName;
};

function ExploreIcon({ color }: { color: string }) {
  return (
    <View style={styles.pinFrame}>
      <View style={[styles.pinShape, { borderColor: color }]}>
        <View style={[styles.pinDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function AlertsIcon({ color }: { color: string }) {
  return (
    <View style={styles.bellFrame}>
      <View style={[styles.bellDome, { borderColor: color }]} />
      <View style={[styles.bellBase, { backgroundColor: color }]} />
      <View style={[styles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.profileFrame}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

export default function BottomTabIcon({ focused = false, name }: BottomTabIconProps) {
  const color =
    name === 'favorites' && !focused
      ? bottomTabColors.heart
      : name === 'favorites' && focused
      ? bottomTabColors.heartActive
      : focused
      ? bottomTabColors.active
      : bottomTabColors.inactive;

  return (
    <View style={[styles.iconBox, focused ? styles.iconBoxFocused : undefined]}>
      {name === 'explore' && <ExploreIcon color={color} />}
      {name === 'favorites' && <Text style={[styles.heartIcon, { color }]}>♥</Text>}
      {name === 'alerts' && <AlertsIcon color={color} />}
      {name === 'profile' && <ProfileIcon color={color} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bellBase: {
    borderRadius: 2,
    height: 3,
    marginTop: -1,
    width: 22,
  },
  bellClapper: {
    borderRadius: 4,
    height: 5,
    marginTop: 2,
    width: 5,
  },
  bellDome: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderBottomWidth: 0,
    height: 19,
    width: 21,
  },
  bellFrame: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  heartIcon: {
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 36,
  },
  iconBoxFocused: {
    backgroundColor: '#FFF0EA',
  },
  pinDot: {
    borderRadius: 3,
    height: 6,
    transform: [{ rotate: '-45deg' }],
    width: 6,
  },
  pinFrame: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    paddingBottom: 3,
    width: 28,
  },
  pinShape: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 3,
    height: 20,
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    width: 20,
  },
  profileBody: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderBottomWidth: 0,
    height: 12,
    marginTop: 3,
    width: 24,
  },
  profileFrame: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  profileHead: {
    borderRadius: 8,
    borderWidth: 3,
    height: 15,
    width: 15,
  },
});
