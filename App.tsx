import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  NativeEventEmitter,
  NativeModules,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import NativeMagnetometer from './specs/NativeMagnetometer';
import { SafeAreaView } from 'react-native-safe-area-context';

const DIAL_SIZE = 280;
const INNER_TRACK_SIZE = 190;
const CENTER_HUB_SIZE = 126;

// Generate 36 tick marks (every 10 degrees)
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

export const App = () => {
  const [azimuth, setAzimuth] = useState<number>(260);
  const rotateValue = useRef(new Animated.Value(-260)).current;
  const lastHeadingRef = useRef<number>(-260);

  useEffect(() => {
    const magnetometerModule =
      NativeModules.NativeMagnetometer || NativeMagnetometer;

    const eventEmitter = new NativeEventEmitter(magnetometerModule);

    const subscription = eventEmitter.addListener(
      'onMagnetometerData',
      (data: any) => {
        const heading = Math.round(((data.azimuth % 360) + 360) % 360);

        setAzimuth(heading);

        let currentTarget = -heading;
        const prevTarget = lastHeadingRef.current;
        const diff = currentTarget - prevTarget;

        if (diff > 180) {
          currentTarget -= 360;
        } else if (diff < -180) {
          currentTarget += 360;
        }

        lastHeadingRef.current = currentTarget;

        Animated.timing(rotateValue, {
          toValue: currentTarget,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      },
    );

    NativeMagnetometer.startUpdating();

    return () => {
      subscription.remove();
      NativeMagnetometer.stopUpdating();
    };
  }, [rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  const getDirectionText = (degree: number): string => {
    const normalizedDegree = ((degree % 360) + 360) % 360;
    if (normalizedDegree >= 337.5 || normalizedDegree < 22.5) return 'N';
    if (normalizedDegree >= 22.5 && normalizedDegree < 67.5) return 'NE';
    if (normalizedDegree >= 67.5 && normalizedDegree < 112.5) return 'E';
    if (normalizedDegree >= 112.5 && normalizedDegree < 157.5) return 'SE';
    if (normalizedDegree >= 157.5 && normalizedDegree < 202.5) return 'S';
    if (normalizedDegree >= 202.5 && normalizedDegree < 247.5) return 'SW';
    if (normalizedDegree >= 247.5 && normalizedDegree < 292.5) return 'W';
    if (normalizedDegree >= 292.5 && normalizedDegree < 337.5) return 'NW';
    return 'N';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="auto"/>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compass</Text>
      </View>

      {/* Main Compass Area */}
      <View style={styles.container}>
        {/* Subtle Outer Ambient Ring */}
        <View style={styles.outerAmbientRing}>
          {/* Fixed Cardinal Letters (N, E, S, W) */}
          <Text style={[styles.cardinalText, styles.northLabel]}>N</Text>
          <Text style={[styles.cardinalText, styles.eastLabel]}>E</Text>
          <Text style={[styles.cardinalText, styles.southLabel]}>S</Text>
          <Text style={[styles.cardinalText, styles.westLabel]}>W</Text>

          {/* Main Elevated Compass Disc */}
          <View style={styles.compassDisc}>
            {/* Rotating Degree Ticks & Numbers */}
            <Animated.View
              style={[styles.rotatingDial, { transform: [{ rotate: spin }] }]}
            >
              {TICKS.map(deg => {
                const isCardinal = deg % 90 === 0;
                const isMajor = deg % 30 === 0;

                return (
                  <View
                    key={deg}
                    style={[
                      styles.tickWrapper,
                      { transform: [{ rotate: `${deg}deg` }] },
                    ]}
                  >
                    <View
                      style={[
                        styles.tickMark,
                        isMajor ? styles.majorTick : styles.minorTick,
                        isCardinal && styles.cardinalTick,
                      ]}
                    />
                    {isMajor && (
                      <Text
                        style={[
                          styles.degreeLabel,
                          isCardinal && styles.cardinalDegreeLabel,
                        ]}
                      >
                        {deg}°
                      </Text>
                    )}
                  </View>
                );
              })}
            </Animated.View>

            {/* Recessed Inner Track */}
            <View style={styles.innerTrack}>
              {/* Orbiting Orange Indicator Dot */}
              <View
                style={[
                  styles.dotOrbit,
                  { transform: [{ rotate: `${azimuth}deg` }] },
                ]}
              >
                <View style={styles.orangeDot} />
              </View>

              {/* Center Fixed Readout Hub */}
              <View style={styles.centerHub}>
                <View style={styles.arrowHub} />
                <View style={styles.degreeRow}>
                  <Text style={styles.headingValue}>{azimuth}</Text>
                  <Text style={styles.degreeSymbol}>°</Text>
                </View>
                <Text style={styles.directionValue}>
                  {getDirectionText(azimuth)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F6FC',
  },
  header: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 8,
  },
  backTab: {
    position: 'absolute',
    left: -18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#373D49',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3440',
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  outerAmbientRing: {
    width: 356,
    height: 356,
    borderRadius: 178,
    borderWidth: 2,
    borderColor: '#E5ECF8',
    backgroundColor: '#F5F8FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '600',
    color: '#5C667A',
  },
  northLabel: {
    top: 8,
    color: '#DC2626',
    fontWeight: '700',
  },
  southLabel: {
    bottom: 8,
  },
  eastLabel: {
    right: 12,
  },
  westLabel: {
    left: 10,
  },
  compassDisc: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: '#F4F7FD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8C6DF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  rotatingDial: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWrapper: {
    position: 'absolute',
    width: 36,
    height: DIAL_SIZE,
    alignItems: 'center',
    paddingTop: 6,
  },
  tickMark: {
    borderRadius: 1,
  },
  minorTick: {
    width: 1,
    height: 7,
    backgroundColor: '#CBD5E1',
  },
  majorTick: {
    width: 1.5,
    height: 13,
    backgroundColor: '#94A3B8',
  },
  cardinalTick: {
    width: 2,
    height: 14,
    backgroundColor: '#E07A5F',
  },
  degreeLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#8A96AB',
    fontVariant: ['tabular-nums'],
  },
  cardinalDegreeLabel: {
    color: '#475569',
    fontWeight: '700',
  },
  innerTrack: {
    width: INNER_TRACK_SIZE,
    height: INNER_TRACK_SIZE,
    borderRadius: INNER_TRACK_SIZE / 2,
    backgroundColor: '#E4ECF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DCE5F5',
  },
  dotOrbit: {
    position: 'absolute',
    width: INNER_TRACK_SIZE,
    height: INNER_TRACK_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 5,
  },
  orangeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3703A',
    borderWidth: 2.5,
    borderColor: '#FF9E6D',
    shadowColor: '#F3703A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  centerHub: {
    width: CENTER_HUB_SIZE,
    height: CENTER_HUB_SIZE,
    borderRadius: CENTER_HUB_SIZE / 2,
    backgroundColor: '#F7FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E8EFFB',
    shadowColor: '#A3B4D1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  arrowHub: {
    position: 'absolute',
    top: -11, // Sits right on top of the 3px border
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F3703A',
  },
  degreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  headingValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4B5565',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  degreeSymbol: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4B5565',
    marginTop: 2,
    marginLeft: 1,
  },
  directionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#647084',
    marginTop: 2,
  },
});
