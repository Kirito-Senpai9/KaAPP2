import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import KachanTabs from '@/navigation/KachanTabs';
import TelaLogin from '@/screens/TelaLogin';
import StoryViewer from '@/screens/StoryViewer';
import CriarStories from '@/screens/CriarStories';
import CriarPostagem from '@/screens/CriarPostagem';
import CriarShorts from '@/screens/CriarShorts';
import LiveSetup from '@/screens/LiveSetup';

export type RootStackParamList = {
  TelaLogin: undefined;
  RootTabs: undefined;
  StoryViewer: any;
  CriarStories: undefined;
  CriarPostagem: undefined;
  CriarShorts: undefined;
  LiveSetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="TelaLogin" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TelaLogin" component={TelaLogin} />
        <Stack.Screen name="RootTabs" component={KachanTabs} />
        <Stack.Screen name="StoryViewer" component={StoryViewer as any} />
        <Stack.Screen name="CriarStories" component={CriarStories} />
        <Stack.Screen name="CriarPostagem" component={CriarPostagem} />
        <Stack.Screen name="CriarShorts" component={CriarShorts} />
        <Stack.Screen name="LiveSetup" component={LiveSetup} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
