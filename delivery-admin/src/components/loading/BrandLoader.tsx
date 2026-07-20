import { ActivityIndicator, StyleSheet, View } from 'react-native';

type BrandLoaderProps = {
  size?: 'small' | 'large';
  fullScreen?: boolean;
};

export function BrandLoader({
  size = 'large',
  fullScreen = false,
}: BrandLoaderProps) {
  return (
    <View style={[styles.wrap, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color="#6d32c5" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  fullScreen: {
    flex: 1,
    paddingVertical: 0,
  },
});
