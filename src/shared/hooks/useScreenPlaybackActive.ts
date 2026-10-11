import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/** One subscription per screen; cards receive the resulting eligibility as a prop. */
export function useScreenPlaybackActive(): boolean {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [windowFocused, setWindowFocused] = useState(true);

  useEffect(() => {
    setAppActive(AppState.currentState === 'active');
    const stateSubscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    // Opening the notification shade on Android does not change AppState.
    const blurSubscription = Platform.OS === 'android'
      ? AppState.addEventListener('blur', () => setWindowFocused(false))
      : null;
    const focusSubscription = Platform.OS === 'android'
      ? AppState.addEventListener('focus', () => setWindowFocused(true))
      : null;

    return () => {
      stateSubscription.remove();
      blurSubscription?.remove();
      focusSubscription?.remove();
    };
  }, []);

  return isFocused && appActive && windowFocused;
}
