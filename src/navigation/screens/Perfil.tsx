import { Text } from '@react-navigation/elements';
import { StaticScreenProps } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

type PerfilProps = StaticScreenProps<{
  user: string;
}>;

export function Perfil({ route }: PerfilProps) {
  return (
    <View style={styles.container}>
      <Text>Perfil de {route.params.user}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
