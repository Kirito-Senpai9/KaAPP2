# KaAPP2

Aplicativo React Native (Expo) com navegação baseada em **uma única fonte de verdade** e organização por domínio em `src/features/*`.

- `src/App.tsx` define o container de navegação e o `RootStack` principal.
- `src/navigation/types.ts` define os tipos centrais de navegação (`RootStackParamList`).

## Arquitetura de navegação

### `src/App.tsx` como composição das telas de feature

`src/App.tsx` é o ponto de entrada da navegação. Ele:

- monta o `NavigationContainer`;
- cria o `RootStack` tipado com `RootStackParamList`;
- compõe telas vindas de múltiplas features (ex.: `auth`, `stories`, `create`, `shorts`, `comments`), registrando-as como rotas do stack;
- conecta a rota `RootTabs` (tabs principais) às demais rotas de fluxo modal/fullscreen.

Em outras palavras, o `App.tsx` **não é um diretório de telas**: ele orquestra telas de domínio que vivem em `src/features/*`.

### Papel de `src/navigation/*`

A pasta `src/navigation/*` centraliza a infraestrutura de navegação:

- `KachanTabs.tsx`: define o `BottomTabNavigator` customizado e o comportamento visual/funcional das abas (`Home`, `Shorts`, `Criar`, `Comunidade`, `Perfil`);
- `types.ts`: define `RootStackParamList` e tipos auxiliares de navegação usados entre features.

Isso mantém regras de roteamento e tipagem desacopladas da implementação de cada tela.

## Estrutura relevante

```txt
src/
  App.tsx                          # Composition root da navegação (NavigationContainer + RootStack)
  navigation/
    KachanTabs.tsx                 # Configuração das tabs
    types.ts                       # Tipos de navegação (RootStackParamList etc.)
  features/
    auth/
      screens/
      hooks/
      services/
      types/
    feed/
      screens/
      hooks/
      services/
      types/
    stories/
      screens/
      hooks/
      services/
      types/
    comments/
      screens/
      hooks/
      services/
      types/
    ...                            # Demais domínios seguem o mesmo padrão
  screens/                         # LEGADO: wrappers de compatibilidade/reexport
```

## Convenção de organização (obrigatória)

Para novas implementações, siga sempre organização por domínio em `src/features/<dominio>/`:

- novas **telas**: `src/features/<dominio>/screens`;
- novos **hooks**: `src/features/<dominio>/hooks`;
- novos **services** (API, mocks, adapters): `src/features/<dominio>/services`;
- novos **types** (tipos/interfaces do domínio): `src/features/<dominio>/types`.

> `src/screens/*` está marcado como **legado** e deve ser usado apenas temporariamente para compatibilidade de imports antigos. Não é mais a fonte principal para criação de telas.

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
