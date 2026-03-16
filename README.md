# KaAPP2

Aplicativo React Native (Expo) organizado por **feature-first architecture** em `src/features/*`, com tipagem de navegação centralizada.

- `src/App.tsx` define o container de navegação e o `RootStack` principal.
- `src/navigation/types.ts` define os tipos centrais (`RootStackParamList`).

## Arquitetura de navegação

### `src/App.tsx` como composition root

`src/App.tsx` é o ponto de entrada da navegação. Ele:

- monta o `NavigationContainer`;
- cria o `RootStack` tipado com `RootStackParamList`;
- registra telas importadas de features (`auth`, `feed`, `stories`, `create`, `shorts`, `comments`, `community`, `profile`);
- conecta `RootTabs` com fluxos modal/fullscreen.

Ou seja, o `App.tsx` apenas **orquestra** as features; não é um diretório de telas.

### Papel de `src/navigation/*`

A pasta `src/navigation/*` centraliza a infraestrutura de navegação:

- `KachanTabs.tsx`: define o `BottomTabNavigator` customizado e o comportamento das abas (`Home`, `Shorts`, `Criar`, `Comunidade`, `Perfil`);
- `types.ts`: define `RootStackParamList` e tipos auxiliares usados entre features.

## Estrutura atual (fonte de verdade)

```txt
src/
  App.tsx
  navigation/
    KachanTabs.tsx
    types.ts
  features/
    auth/
      screens/
    feed/
      screens/
      hooks/
      services/
    stories/
      screens/
      hooks/
      services/
    create/
      screens/
    shorts/
      screens/
      hooks/
      services/
    comments/
      screens/
      hooks/
      services/
      utils/
    community/
      screens/
    profile/
      screens/
```

## `src/screens/*` (somente legado)

A pasta `src/screens/*` existe apenas para **compatibilidade temporária** com imports antigos.

- Não criar telas novas em `src/screens/*`.
- Não tratar `src/screens/*` como estrutura principal da aplicação.
- Toda evolução deve acontecer em `src/features/<dominio>/*`.

## Convenção de organização

Para novas implementações, seguir sempre `src/features/<dominio>/`:

- **screens**: componentes de tela do domínio;
- **hooks**: lógica reutilizável do domínio;
- **services**: camada de acesso a dados/API/adapters;
- **types**: tipos/interfaces locais do domínio;
- **utils** (quando necessário): helpers internos do domínio.

## Como rodar

```bash
npm install
npm start
```

Plataformas específicas:

```bash
npm run android
npm run ios
npm run web
```
