import Animated from 'react-native-reanimated';

export function WorldWave() {
  return (
    <Animated.Text
      style={{
      fontSize: 28,
      lineHeight: 32,
      marginTop: -6,
      animationName: {
        '100%': { transform: [{ rotate: '360deg' }] },
      },
      animationIterationCount: 1,
      animationDuration: '2000ms',
      }}>
      🌍
    </Animated.Text>
  );
}
