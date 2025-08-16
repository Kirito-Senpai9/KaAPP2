import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TelaLogin from './screens/TelaLogin';
import { TelaInicial as Telainicial } from './navigation/screens/TelaInicial';

export type RootStackParamList = {
  TelaLogin: undefined;
  Telainicial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="TelaLogin"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="TelaLogin" component={TelaLogin} />
        <Stack.Screen name="Telainicial" component={Telainicial} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
