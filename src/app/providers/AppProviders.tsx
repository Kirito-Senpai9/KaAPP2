import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import QueryProvider from '@/app/providers/QueryProvider';

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
