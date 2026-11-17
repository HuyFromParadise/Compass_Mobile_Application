import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startUpdating(): void;
  stopUpdating(): void;
  // Events: 'onMagnetometerData' -> { x: number, y: number, z: number, azimuth: number }
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeMagnetometer');