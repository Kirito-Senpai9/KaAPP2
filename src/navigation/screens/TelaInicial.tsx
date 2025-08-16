import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

export function TelaInicial() {
  return (
    <View style={styles.container}>
      <Text>Tela Inicial</Text>
      <Text>Abra 'src/App.tsx' para começar a trabalhar no seu app!</Text>
      <Button screen="Perfil" params={{ user: 'jane' }}>
        Ir para Perfil
      </Button>
      <Button screen="Configuracoes">Ir para Configurações</Button>
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
