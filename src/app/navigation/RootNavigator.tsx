import React from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import KachanTabs from '@/app/navigation/KachanTabs';
import type { RootStackParamList } from '@/app/navigation/types';
import { CriarPostagemScreen, LiveSetupScreen } from '@/features/create';
import { CriarShortsScreen } from '@/features/shorts';
import { CriarStoriesScreen, StoryViewerScreen } from '@/features/stories';
import { TelaLoginScreen } from '@/features/auth';
import { EditarPerfilScreen } from '@/features/profile';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
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
        <Stack.Screen name="CriarStories" component={CriarStoriesScreen} />
        <Stack.Screen name="CriarPostagem" component={CriarPostagemScreen} />
        <Stack.Screen name="CriarShorts" component={CriarShortsScreen} />
        <Stack.Screen name="LiveSetup" component={LiveSetupScreen} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
