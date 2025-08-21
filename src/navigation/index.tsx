import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HeaderButton, Text } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { createStaticNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { Image } from 'react-native';
import bell from '../assets/bell.png';
import newspaper from '../assets/newspaper.png';
import { TelaInicial } from './screens/TelaInicial';
import { Perfil } from './screens/Perfil';
import { Configuracoes } from './screens/Configuracoes';
import { Notificacoes } from './screens/Notificacoes';
import { NaoEncontrado } from './screens/NaoEncontrado';
import Criar from '../screens/Criar';
import CriarStories from '../screens/CriarStories';
import CriarPostagem from '../screens/CriarPostagem';
import CriarShorts from '../screens/CriarShorts';
import LiveSetup from '../screens/LiveSetup';

export type RootStackParamList = {
  HomeTabs: undefined;
  Criar: undefined;
  CriarStories: undefined;
  CriarPostagem: undefined;
  CriarShorts: undefined;
  LiveSetup: undefined;
  Perfil: { user: string };
  Configuracoes: undefined;
  Notificacoes: undefined;
  NaoEncontrado: undefined;
};

const HomeTabs = createBottomTabNavigator({
  screens: {
    TelaInicial: {
      screen: TelaInicial,
      options: {
        title: 'Feed',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Notificacoes: {
      screen: Notificacoes,
      options: {
        tabBarIcon: ({ color, size }) => (
          <Image
            source={bell}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    HomeTabs: {
      screen: HomeTabs,
      options: {
        title: 'Home',
        headerShown: false,
      },
    },
    Perfil: {
      screen: Perfil,
      linking: {
        path: ':user(@[a-zA-Z0-9-_]+)',
        parse: {
          user: (value) => value.replace(/^@/, ''),
        },
        stringify: {
          user: (value) => `@${value}`,
        },
      },
    },
    Configuracoes: {
      screen: Configuracoes,
      options: ({ navigation }) => ({
        presentation: 'modal',
        headerRight: () => (
          <HeaderButton onPress={navigation.goBack}>
            <Text>Close</Text>
          </HeaderButton>
        ),
      }),
    },
    Criar: {
      screen: Criar,
      options: {
        title: 'Criar',
      },
    },
    CriarStories: {
      screen: CriarStories,
      options: {
        title: 'Criar Stories',
      },
    },
    CriarPostagem: {
      screen: CriarPostagem,
      options: {
        title: 'Criar Postagem',
      },
    },
    CriarShorts: {
      screen: CriarShorts,
      options: {
        title: 'Criar Shorts',
      },
    },
    LiveSetup: {
      screen: LiveSetup,
      options: {
        title: 'Live Streamer',
      },
    },
    NaoEncontrado: {
      screen: NaoEncontrado,
      options: {
        title: '404',
      },
      linking: {
        path: '*',
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

export function useAppNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
