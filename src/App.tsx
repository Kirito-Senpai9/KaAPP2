import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import Tabs from '@/navigation/Tabs';
import TelaLogin from '@/screens/TelaLogin';
import StoryViewer from '@/screens/StoryViewer';

export type RootStackParamList = {
  TelaLogin: undefined;
  RootTabs: undefined;
  StoryViewer: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="TelaLogin" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TelaLogin" component={TelaLogin} />
        <Stack.Screen name="RootTabs" component={Tabs} />
        <Stack.Screen name="StoryViewer" component={StoryViewer as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
