import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import KachanTabs from '@/navigation/KachanTabs';
import { TelaLoginScreen } from '@/features/auth/screens';
import { StoryViewerScreen } from '@/features/stories/screens';
import { CriarStoriesScreen } from '@/features/stories/screens';
import { CriarPostagemScreen, LiveSetupScreen } from '@/features/create/screens';
import { CriarShortsScreen } from '@/features/shorts/screens';

import { ComentariosPostagemScreen } from '@/features/comments/screens';
import { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            initialRouteName="TelaLogin"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 240,
              animationTypeForReplace: 'push',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="TelaLogin" component={TelaLoginScreen} />
            <Stack.Screen name="RootTabs" component={KachanTabs} />
            <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
            <Stack.Screen name="ComentariosPostagem" component={ComentariosPostagemScreen} />
            <Stack.Screen name="CriarStories" component={CriarStoriesScreen} />
            <Stack.Screen name="CriarPostagem" component={CriarPostagemScreen} />
            <Stack.Screen name="CriarShorts" component={CriarShortsScreen} />
            <Stack.Screen name="LiveSetup" component={LiveSetupScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
