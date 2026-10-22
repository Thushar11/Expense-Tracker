import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from '../constants/theme';
import { useStore } from '../store/StoreProvider';

export function useAppTheme() {
  const system = useColorScheme();
  const { settings } = useStore();
  const scheme = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
  return { scheme, colors: scheme === 'dark' ? darkColors : lightColors, currency: settings.currency };
}
