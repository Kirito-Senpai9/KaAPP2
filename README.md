# KaAPP2

Aplicativo React Native (Expo) com navegação baseada em **uma única fonte de verdade**:

- `src/App.tsx` define o container de navegação e o `RootStack` principal.
- `src/navigation/types.ts` define os tipos centrais de navegação (`RootStackParamList`).

## Arquitetura de navegação

### Stack raiz (`src/App.tsx`)

O app usa `createNativeStackNavigator<RootStackParamList>()` com as rotas:

- `TelaLogin`
- `RootTabs`
- `StoryViewer`
- `ComentariosPostagem`
- `CriarStories`
- `CriarPostagem`
- `CriarShorts`
- `LiveSetup`

### Tabs (`src/navigation/KachanTabs.tsx`)

A rota `RootTabs` renderiza um `BottomTabNavigator` customizado com 5 abas:

- `Home`
- `Shorts`
- `Criar`
- `Comunidade`
- `Perfil`

A tela `Criar` dispara navegações para rotas do Stack raiz (ex.: `CriarStories`, `LiveSetup`).

### Tipagem (`src/navigation/types.ts`)

O tipo `RootStackParamList` é a referência única para rotas do stack e parâmetros aceitos por cada tela. Qualquer `navigate(...)` para o Stack deve usar somente rotas desse tipo.

## Estrutura relevante

```txt
src/
  App.tsx                    # NavigationContainer + RootStack
  navigation/
    KachanTabs.tsx           # Tabs customizadas
    types.ts                 # RootStackParamList e tipos de Story
  features/
    */screens/               # Telas por domínio (fonte oficial)
```

## Migração de imports de telas

- Imports via `@/screens/*` foram descontinuados e removidos.
- Use somente `@/features/*/screens` (ou os índices de cada feature).
- Regra interna: execute `npm run lint:imports` para bloquear novos imports legados.

### Depreciação

A camada de wrappers em `src/screens/` já foi removida nesta branch por não haver referências ativas. Não há período de transição pendente.

## Como rodar

```bash
npm install
npm start
```

Para abrir em plataformas específicas:

```bash
npm run android
npm run ios
npm run web
```
