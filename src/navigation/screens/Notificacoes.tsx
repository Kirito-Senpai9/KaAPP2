import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

export function Notificacoes() {
  return (
    <View style={styles.container}>
      <Text>Tela Notificacoes</Text>
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
