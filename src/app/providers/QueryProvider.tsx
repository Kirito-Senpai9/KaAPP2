import React, { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import {
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import { queryClient } from '@/app/queryClient';

type QueryProviderProps = {
  children: React.ReactNode;
};

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export default function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
