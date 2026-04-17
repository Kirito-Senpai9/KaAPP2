# AGENTS.md — Prompt Maestro para Agentes de IA

> **Propósito:** Este arquivo é o prompt de sistema autoritativo para agentes de IA (Claude Code, OpenAI Codex, Cursor, Copilot, etc.) que geram código neste projeto.
> Leia este arquivo inteiro antes de escrever qualquer linha de código. Cada regra aqui é baseada em conhecimento de produção consolidado do ecossistema React Native / Expo (2025–2026).

---

## INSTRUÇÕES OBRIGATÓRIAS PARA O AGENTE (FLUXO PRÉ-CÓDIGO)

## Fluxo obrigatório ANTES de qualquer alteração de código

Antes de escrever, editar ou gerar qualquer linha de código, o agente DEVE seguir esta sequência completa:

1. **Análise de bibliotecas e frameworks**
   - Identifique todas as libs/frameworks envolvidos na tarefa.
   - Revise a documentação oficial mais recente (prioritize official docs).
   - Liste versões atuais e possíveis incompatibilidades.

2. **Pesquisa de melhores práticas e armadilhas comuns**
   - Considere técnicas amplamente adotadas pela comunidade.
   - Leve em conta soluções discutidas em GitHub Issues, Stack Overflow e fóruns técnicos.
   - Identifique os 3 erros mais comuns relacionados ao problema.

3. **Validação de segurança e performance**
   - Verifique possíveis vulnerabilidades conhecidas (OWASP, CVEs quando aplicável).
   - Avalie impacto em performance e escalabilidade.

4. **Plano de implementação**
   - Descreva um plano passo a passo antes de gerar código.
   - Inclua testes (unitários e/ou integração) que devem ser executados após a implementação.

---

## Regras gerais (sempre aplicadas)

- Nunca pule a etapa de análise antes de codar.
- Nunca gere código diretamente sem explicar o plano primeiro.
- Sempre siga o padrão de arquitetura e nomenclatura já existente no projeto.
- Sempre escrever código limpo, modular e pronto para produção.
- Sempre incluir tratamento de erros.
- Sempre considerar edge cases.
- Após qualquer alteração, executar ou descrever os testes necessários.
- Se houver qualquer ambiguidade ou dúvida, perguntar ao usuário antes de continuar.

---

## Comportamento esperado

- Priorizar documentação oficial sobre qualquer outra fonte.
- Preferir soluções estáveis e amplamente utilizadas.
- Evitar soluções experimentais sem justificativa.
- Explicar decisões técnicas de forma objetiva.

---

## 🚨 PRESERVAÇÃO DO DESIGN VISUAL — REGRA ABSOLUTA

> Esta seção tem prioridade sobre qualquer outra instrução do arquivo. Nenhuma regra de performance, styling ou refatoração sobrepõe a proteção do design visual existente.

Este projeto possui um sistema de design visual próprio e consolidado. O agente NUNCA deve alterar a identidade visual do app sem aprovação explícita do usuário.

**O agente NUNCA deve:**
- Alterar cores, gradientes, opacidades ou paleta de cores do projeto.
- Alterar tipografia: fontes, tamanhos, pesos (fontWeight), espaçamento entre letras ou linhas.
- Alterar espaçamentos (padding, margin) de componentes existentes.
- Alterar border radius, sombras, elevações ou efeitos visuais.
- Alterar ícones, ilustrações ou assets visuais.
- Substituir ou modificar componentes de UI existentes (botões, cards, inputs, headers, tabs, modais) sem aprovação.
- Introduzir novos componentes visuais que quebrem o padrão estético atual.
- Usar valores de cores, tamanhos ou espaçamentos tirados de exemplos deste arquivo — os exemplos de código aqui são ilustrativos de padrões técnicos, **não representam os valores reais do design do projeto**.

**O agente DEVE:**
- Ao criar um novo componente, inspecionar componentes similares já existentes no projeto e replicar o mesmo padrão visual.
- Ao precisar de uma cor, tamanho ou espaçamento, buscar o valor já usado no projeto — nunca inventar ou assumir.
- Se não encontrar o valor correto no projeto, **perguntar ao usuário** antes de prosseguir.
- Tratar qualquer mudança visual, por menor que seja, como uma mudança que requer aprovação explícita.

---

## Boas práticas obrigatórias de performance

- Antes de implementar qualquer feature nova, avaliar impacto em renderização, lista, imagem, animação e cache.
- Em listas críticas, preferir FlashList v2 ou BottomSheetFlashList em vez de FlatList comum.
- Sempre usar keyExtractor estável, getItemType quando fizer sentido e evitar renderItem recriado sem necessidade.
- Preferir expo-image para imagens remotas e repetidas, com cache apropriado e recyclingKey em listas recicláveis.
- Preferir react-native-reanimated para animações interativas e de alta frequência.
- Evitar trabalho desnecessário na JS thread durante scroll, gesture ou animação.
- Memoizar itens de lista, handlers e valores derivados com React.memo, useCallback e useMemo quando houver ganho real.
- Evitar estado global desnecessário; quando precisar compartilhar estado de UI, preferir stores pequenas e seletoras estáveis.
- Para dados assíncronos, preferir cache e deduplicação com React Query antes de criar estados paralelos manuais.
- Não introduzir armazenamento nativo ou dependências com requisito de build custom se o alvo principal for Expo Go, sem justificar claramente o tradeoff.
- Toda mudança orientada a performance deve manter a mesma UI, layout, navegação e comportamento, salvo se o usuário aprovar mudança visual ou funcional.
- Ao finalizar uma alteração de performance, validar com typecheck e fazer busca final por APIs legadas que deveriam ter sido substituídas.

---
---

# REFERÊNCIA TÉCNICA COMPLETA — STACK E REGRAS DETALHADAS

> O que segue é o detalhamento técnico de cada área da stack. Use como referência durante a etapa de "Análise" do fluxo acima.

---

## 1. OFFICIAL PROJECT STACK

> Versões extraídas diretamente do `package.json` e `app.json` do projeto em abril de 2026. Use estas versões como referência canônica ao sugerir bibliotecas, APIs e sintaxes — nunca assuma uma versão mais nova sem verificar compatibilidade.

```
App:             KaAPP2 (slug: KaAPP2, scheme: kaapp2)
Runtime:         React Native 0.81.5
Framework:       Expo SDK ~54.0.0 (Managed Workflow)
New Arch:        ENABLED (newArchEnabled: true no app.json)
Language:        TypeScript ~5.9.2
React:           19.1.0
Engine:          Hermes (padrão no Expo SDK 54 com New Arch)

— NAVEGAÇÃO —
Navigation:      React Navigation v7
                 @react-navigation/native ^7.1.17
                 @react-navigation/native-stack ^7.3.25
                 @react-navigation/bottom-tabs ^7.4.6
                 (⚠️ Expo Router NÃO está instalado neste projeto)

— ESTADO & DADOS —
State (client):  Zustand ^5.0.12
State (server):  TanStack Query ^5.91.3

— ANIMAÇÕES & GESTOS —
Animations:      React Native Reanimated ~4.1.1  ← VERSÃO 4, não 3
Worklets:        react-native-worklets 0.5.1 (companion obrigatório do Reanimated 4)
Gestures:        React Native Gesture Handler ~2.28.0

— LISTAS —
Lists:           FlashList v2 (@shopify/flash-list 2.0.2)
BottomSheet:     @gorhom/bottom-sheet ^5.2.8 (usar BottomSheetFlashList para listas dentro de bottom sheets)

— IMAGENS & MÍDIA —
Images:          expo-image ~3.0.11
Video:           expo-video ~3.0.16

— STORAGE —
Storage:         ⚠️ react-native-mmkv NÃO está instalado.
                 Não há AsyncStorage instalado atualmente.
                 Antes de adicionar storage, avaliar se o alvo é Expo Go (→ AsyncStorage)
                 ou prebuild/bare (→ MMKV). Nunca introduzir dependência nativa silenciosamente.

— STYLING —
Styling:         StyleSheet.create (padrão atual)
                 ⚠️ NativeWind NÃO está instalado neste projeto.
                 Não adicione NativeWind sem aprovação explícita do usuário.

— OUTROS —
Blur:            expo-blur ~15.0.8
Gradient:        expo-linear-gradient ~15.0.8
Icons:           @expo/vector-icons ^15.0.3
ImagePicker:     expo-image-picker ~17.0.10
Edge-to-edge:    react-native-edge-to-edge 1.6.0
EAS Project ID:  c02406f4-e8e8-4486-822e-6c1f07736102
```

> ⚠️ **Nota sobre New Architecture no SDK 54:** `newArchEnabled: true` está explicitamente declarado no `app.json`. No SDK 54 / RN 0.81.5, a New Architecture está ativa mas ainda pode ser desabilitada (diferente do SDK 55+/RN 0.82+ onde é obrigatória). Trate como ativa e não introduza código que dependa da bridge legada.

> ⚠️ **Reanimated 4 (não 3):** Este projeto usa `react-native-reanimated ~4.1.1`. A API principal (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`) é compatível com Reanimated 3, mas a v4 requer o pacote companion `react-native-worklets` e tem melhorias de detecção automática de worklets. Sempre consulte a documentação da v4 em https://docs.swmansion.com/react-native-reanimated/ antes de gerar código de animação.

---

## 2. ARCHITECTURE — NON-NEGOTIABLES

### 2.1 New Architecture

- ALWAYS assume the New Architecture (Fabric + JSI + TurboModules) is enabled. There is no legacy bridge.
- NEVER write code that assumes the old asynchronous bridge (e.g., batch NativeModules calls, serialize large payloads across the bridge).
- PREFER libraries explicitly updated for the New Architecture. Check the library's README for New Architecture compatibility before recommending.
- ALWAYS use Hermes. Never suggest switching to JSC. Hermes provides faster startup (30–50%), smaller bundles, and lower memory usage.

### 2.2 TypeScript

- ALWAYS use TypeScript. Never use `.js` or `.jsx` files.
- ALWAYS enable `"strict": true` in `tsconfig.json`. This includes `noImplicitAny`, `strictNullChecks`, and `strictFunctionTypes`.
- NEVER use `any` type. Use `unknown` and narrow with type guards when needed.
- PREFER Zod schemas for runtime validation of external data (API responses, navigation params, storage values).

---

## 3. RENDERING & PERFORMANCE — CRITICAL RULES

### 3.1 Re-render Prevention

**CRITICAL:** Unnecessary re-renders are the #1 performance killer in React Native.

- ALWAYS memoize components that receive stable-reference props using `React.memo`.
- ALWAYS use `useCallback` for functions passed as props to child components or used in dependency arrays.
- ALWAYS use `useMemo` for expensive computations (array transforms, object constructions) inside components.
- NEVER define inline functions directly in JSX props. Extract them above the return statement.
- NEVER create new object or array literals inline in JSX props in hot paths.

> **Nota (2025+):** Se o projeto usar React Compiler (`babel-plugin-react-compiler`), a memoização manual torna-se menos necessária — o compilador lida automaticamente. Verifique se está habilitado antes de adicionar `useMemo`/`useCallback` em excesso.

```tsx
// ❌ BAD — creates a new function reference on every render
<Button onPress={() => handleSubmit(id)} label="Submit" />

// ✅ GOOD — stable reference
const handlePress = useCallback(() => handleSubmit(id), [id]);
<Button onPress={handlePress} label="Submit" />
```

```tsx
// ❌ BAD — inline style object recreated every render
// (os valores visuais abaixo são apenas ilustrativos — use os valores reais do projeto)
<View style={{ padding: PROJECT_SPACING, backgroundColor: PROJECT_COLOR }} />

// ✅ GOOD — StyleSheet.create at module level, created once
// (sempre replique os valores de design já existentes no projeto)
const styles = StyleSheet.create({ container: { padding: PROJECT_SPACING, backgroundColor: PROJECT_COLOR } });
<View style={styles.container} />
```

### 3.2 InteractionManager

- ALWAYS use `InteractionManager.runAfterInteractions()` to defer expensive initialization (heavy calculations, analytics, non-critical data fetching) until after animations and transitions complete.

```tsx
// ✅ GOOD — defer heavy work until after screen transition
useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    loadHeavyData();
  });
  return () => task.cancel();
}, []);
```

### 3.3 Context API Restrictions

- NEVER use React Context for high-frequency global state (scroll position, animation values, real-time data streams).
- ONLY use Context for low-frequency, tree-wide values (theme, locale, auth token). Even then, PREFER Zustand.
- When using Context, ALWAYS split contexts by concern. A single giant `AppContext` causes entire subtrees to re-render on any state change.

---

## 4. LISTS — CRITICAL RULES

### 4.1 FlashList v2 is the Default

- ALWAYS use `FlashList` from `@shopify/flash-list` instead of `FlatList` for any list with more than ~20 items.
- FlashList v2 (New Architecture) does NOT require `estimatedItemSize` — it measures automatically. Remove it if migrating from v1.
- ALWAYS provide a stable `keyExtractor` returning a unique string. Never use array index as key for dynamic lists.
- ALWAYS provide `getItemType` when the list has items of different types — this improves cell recycling efficiency.
- ALWAYS memoize `renderItem` with `useCallback`.
- ALWAYS wrap list item components in `React.memo`.

```tsx
// ❌ BAD — FlatList with index-based keys and inline renderItem
<FlatList
  data={items}
  keyExtractor={(_, index) => String(index)}
  renderItem={({ item }) => <ItemCard item={item} />}
/>

// ✅ GOOD — FlashList v2 with stable keys, getItemType and memoized renderItem
import { FlashList } from "@shopify/flash-list";

const renderItem = useCallback(({ item }: { item: Item }) => (
  <ItemCard item={item} />
), []);

<FlashList
  data={items}
  keyExtractor={(item) => item.id}
  getItemType={(item) => item.type}
  renderItem={renderItem}
/>
```

### 4.2 FlatList (edge cases only)

If FlashList cannot be used, configure FlatList properly:

- Set `removeClippedSubviews={true}` on Android.
- Set `maxToRenderPerBatch={10}` and `windowSize={5}`.
- Implement `getItemLayout` whenever item height is fixed — eliminates measurement overhead and enables efficient `scrollToIndex`.
- NEVER use `ScrollView` to render a list of arbitrary length.

---

## 5. ANIMATIONS — CRITICAL RULES

### 5.1 Reanimated 4 — UI Thread Animations

> Este projeto usa **react-native-reanimated ~4.1.1** com o companion **react-native-worklets 0.5.1**. Sempre que gerar código de animação, consulte a documentação da v4. A API principal é compatível com v3, mas a v4 tem melhorias automáticas de detecção de worklets.

- ALWAYS use `react-native-reanimated` for any animation that must run at 60/120 FPS.
- NEVER use the core `Animated` API for anything beyond trivial, one-shot fade-ins. It runs on the JS thread and drops frames under load.
- ALWAYS use `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, and `withDecay` from Reanimated.
- NEVER read `sharedValue.value` on the React/JS thread in a hot path — causes synchronous blocking between JS and UI threads.

```tsx
// ❌ BAD — reads shared value on JS thread
const handlePress = () => {
  if (opacity.value > 0.5) { doSomething(); } // blocks JS thread
};

// ✅ GOOD — derive inside useAnimatedStyle (runs on UI thread)
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value > 0.5 ? 1 : 0.5,
}));
```

### 5.2 Worklets

- ALWAYS mark functions that run on the UI thread with the `'worklet'` directive, or call them only inside Reanimated hooks.
- NEVER put heavy computation (network calls, large array transforms) inside worklets — they block the UI thread.
- PREFER keeping worklet functions small and pure. Use `runOnJS` to call back to the JS thread only when necessary.

```tsx
// ✅ GOOD — lightweight worklet
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: withSpring(offset.value) }],
}));
```

### 5.3 Gesture Handler

- ALWAYS use `react-native-gesture-handler` instead of `PanResponder` or `TouchableOpacity` for gesture-driven interactions.
- ALWAYS wrap the app root in `<GestureHandlerRootView style={{ flex: 1 }}>`.
- PREFER `Gesture.Pan()`, `Gesture.Tap()`, `Gesture.Pinch()` from the Gesture API (v2) over the legacy component API.

```tsx
// ❌ BAD — PanResponder runs on JS thread, causes jank
const panResponder = PanResponder.create({ onMoveShouldSetPanResponder: () => true });

// ✅ GOOD — Gesture Handler runs on UI thread
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onUpdate((e) => { offsetX.value = e.translationX; })
  .onEnd(() => { offsetX.value = withSpring(0); });

<GestureDetector gesture={pan}>
  <Animated.View style={animatedStyle} />
</GestureDetector>
```

### 5.4 Moti (Declarative Animations)

- USE `moti` (built on Reanimated) for simple declarative mount/unmount transitions and state-driven style changes.
- PREFER raw Reanimated for gesture-driven or scroll-driven animations where fine control matters.

---

## 6. NAVIGATION — RULES

> ⚠️ Este projeto usa **React Navigation v7** (`@react-navigation/native`). Expo Router **não está instalado**. Não sugira nem gere código com `expo-router` sem aprovação explícita do usuário.

### 6.1 React Navigation v7 é o Padrão

- ALWAYS use `@react-navigation/native-stack` for stack navigation (uses native screens via `react-native-screens`).
- ALWAYS use `@react-navigation/bottom-tabs` for tab navigation.
- ALWAYS type your navigation using `NativeStackNavigationProp` e `RouteProp` do `@react-navigation/native-stack`.
- ALWAYS use the `useNavigation()` and `useRoute()` hooks with proper typing. Never use the `navigation` prop directly in deeply nested components.
- NEVER use `navigation.navigate` with untyped string routes — always define a typed `RootStackParamList`.

```tsx
// ✅ GOOD — typed navigation
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};

const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
navigation.navigate('Profile', { userId: '123' });
```

### 6.2 Screen Organization

- NEVER import screen-specific heavy dependencies at the navigator level. Import them only inside the screen components that need them.
- ALWAYS use `lazy` option in navigators where supported to defer screen initialization.
- ALWAYS use `react-native-screens` (já instalado via `react-native-screens ~4.16.0`) — it is enabled by default with React Navigation and is required for native performance.
- Deep linking scheme `"kaapp2"` já está configurado no `app.json`.

---

## 7. STATE MANAGEMENT — RULES

### 7.1 Zustand for Client State

- ALWAYS use Zustand for global client-side state (UI state, user preferences, auth session).
- NEVER put server/async data into Zustand — that is TanStack Query's domain.
- ALWAYS use Zustand selectors to subscribe only to the slice of state a component needs:

```tsx
// ❌ BAD — subscribes to entire store, re-renders on any change
const store = useAppStore();

// ✅ GOOD — subscribes only to what's needed
const user = useAppStore((state) => state.user);
```

- PREFER the `immer` middleware for stores with deeply nested state.
- NEVER serialize large objects into Zustand. Keep state normalized; reference IDs where possible.

### 7.2 TanStack Query for Server State

- ALWAYS use TanStack Query (React Query v5) for ALL data fetching, caching, and server synchronization.
- NEVER manually manage loading/error/data state with `useState + useEffect` for API calls.
- ALWAYS use a query key factory pattern:

```tsx
// ✅ GOOD — query key factory
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

const { data } = useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
});
```

- ALWAYS use `useMutation` with `onMutate` for optimistic updates.
- ALWAYS invalidate related queries after successful mutations.
- CONFIGURE `QueryClient` with sensible mobile defaults:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false, // undesirable in mobile
    },
  },
});
```

### 7.3 Storage — MMKV vs AsyncStorage

- PREFER `react-native-mmkv` for local key-value storage when in bare/prebuild workflow. It is synchronous, ~30x faster, and JSI-based.
- USE `AsyncStorage` when the target is Expo Go or when a native build is not viable. Document the tradeoff and plan migration.
- USE MMKV to persist Zustand stores via the `persist` middleware with a custom MMKV adapter:

```tsx
// ✅ GOOD — MMKV adapter for Zustand persist (bare/prebuild only)
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();

const zustandMMKVStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};
```

---

## 8. IMAGES & MEDIA — RULES

- ALWAYS use `expo-image` instead of React Native's built-in `<Image>` or `react-native-fast-image`.
- ALWAYS provide `contentFit`, `transition`, and a `placeholder` (blurhash/thumbhash) for smooth loading.
- ALWAYS set `recyclingKey={item.id}` when using `expo-image` inside a FlashList — this ensures the correct image is shown after cell recycling.
- ALWAYS use `cachePolicy="memory-disk"` for remote images that repeat across sessions.
- ALWAYS use WebP format for static assets (25–35% smaller than PNG/JPEG at equivalent quality).
- ALWAYS use `Image.prefetch(url)` to pre-warm the cache for images on the next screen.
- NEVER use oversized images. Resize server-side or via CDN to match display dimensions × device pixel ratio.

```tsx
import { Image } from 'expo-image';

// ✅ GOOD
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  placeholder={{ blurhash: item.blurhash }}
  cachePolicy="memory-disk"
  recyclingKey={item.id}
/>
```

---

## 9. STYLING — RULES

> 🚨 **DESIGN PRESERVATION:** Os exemplos de código nesta seção demonstram padrões técnicos de organização de estilos — os valores numéricos e de cor usados (como `padding`, `height`, `backgroundColor`) são **placeholders ilustrativos** e não representam o design real do projeto. NUNCA copie ou assuma esses valores. Sempre use os valores já existentes nos arquivos de estilo/tema do projeto.

> ⚠️ **NativeWind não está instalado neste projeto.** O padrão atual é `StyleSheet.create`. Não adicione NativeWind sem aprovação explícita. Se aprovado no futuro, instalar v5+ e configurar com Expo SDK 54.

### 9.1 StyleSheet.create (Padrão Atual do Projeto)

- ALWAYS use `StyleSheet.create` for all styles in this project.
- ALWAYS define stylesheets at module level, outside the component body — created once, never recreated on render.
- NEVER use inline style objects in hot-path components (list items, animated views).
- USE style arrays `[styles.base, conditionalStyle]` to compose styles — avoids new object creation.

```tsx
// ❌ BAD — new object every render, GC pressure, bad in lists
// (valores ilustrativos — nunca copie estes números para o projeto)
<View style={{ width: dynamicWidth, height: ITEM_HEIGHT, backgroundColor: THEME_COLOR }} />

// ✅ GOOD — static part in StyleSheet, dynamic values merged at render time
// (use os valores de design já definidos no projeto)
const styles = StyleSheet.create({ box: { height: ITEM_HEIGHT } });
<View style={[styles.box, { width: dynamicWidth, backgroundColor: THEME_COLOR }]} />
```

### 9.2 NativeWind (Futuro — não instalado)

- NativeWind v5 (Tailwind para RN) é a evolução recomendada para este projeto, mas **ainda não está instalado**.
- Quando for adotado: compila classes Tailwind em `StyleSheet.create` em build time — zero overhead em runtime no native.
- Migração: não misture `className` (NativeWind) com libs de terceiros que só aceitam `style` prop. Passe `StyleSheet.create` para essas libs.

---

## 10. NETWORKING & DATA — RULES

- ALWAYS use TanStack Query for data fetching (see §7.2).
- PREFER native `fetch` for HTTP requests. Add Axios only if you need request interceptors or upload progress for complex flows — if Axios is already in the project, maintain consistency.
- ALWAYS use HTTPS. Never allow `http://` in production.
- ALWAYS implement error boundaries and loading states for every data-dependent screen.
- PREFER a typed API client layer (`src/api/`) with functions that wrap `fetch` and return typed responses, rather than inline fetch calls in components.
- ALWAYS configure TanStack Query's persistence plugin for offline caching.
- ALWAYS handle `isError` and network-offline states with user-facing fallback UI.

---

## 11. BUNDLE & BUILD OPTIMIZATION — RULES

### 11.1 Import Discipline

- ALWAYS use named/subpath imports for libraries that support tree-shaking.

```tsx
// ❌ BAD — imports entire lodash (~70KB)
import _ from 'lodash';

// ✅ GOOD — imports only what's needed
import groupBy from 'lodash/groupBy';
```

- NEVER import from barrel `index.ts` re-exports of large libraries. Import directly from the subpath.

### 11.2 EAS Build & OTA

- ALWAYS use EAS Build for development and production builds. Never use `expo build` (legacy).
- ALWAYS use EAS Update for OTA updates to JS/asset changes that do not involve native code.
- ALWAYS use Expo's `fingerprint` tool in CI to determine if a native build is needed before publishing OTA.
- NEVER include native code changes (new permissions, new native modules, Info.plist changes) in an OTA update.
- ALWAYS use separate EAS channels: `development`, `preview`, `production`. Never publish directly to production without testing on `preview`.

---

## 12. DIAGNOSTICS & TOOLING — RULES

- ALWAYS integrate `@sentry/react-native` for crash reporting and performance monitoring in production.
- USE Expo Dev Tools and the React Native Performance Monitor (FPS, RAM, JS thread) during development.
- USE React DevTools Profiler to identify component render bottlenecks before and after optimizations.
- CONFIGURE Sentry with `tracesSampleRate` and `reactNavigationInstrumentation` for screen load timing.

---

## 13. TESTING — RULES

- ALWAYS write tests for business logic, custom hooks, and utility functions.
- USE `jest` with `@testing-library/react-native` for component tests.
- NEVER test implementation details (internal state, refs). Test behavior from the user's perspective.
- ALWAYS mock native modules in tests using the Expo Jest preset (`jest-expo`).
- ALWAYS run `tsc --noEmit` (typecheck) and search for legacy APIs after any performance-focused change.

---

## 14. ANTI-PATTERNS — NEVER DO THESE

### ❌ ScrollView for Long Lists

```tsx
// ❌ NEVER — renders ALL items at once, destroys memory
<ScrollView>
  {items.map((item) => <ItemCard key={item.id} item={item} />)}
</ScrollView>

// ✅ ALWAYS
<FlashList data={items} renderItem={renderItem} keyExtractor={(i) => i.id} />
```

### ❌ Context for High-Frequency State

```tsx
// ❌ NEVER — re-renders entire tree 60x/second
const ScrollContext = createContext({ scrollY: 0 });

// ✅ ALWAYS — Reanimated shared value, runs on UI thread
const scrollY = useSharedValue(0);
```

### ❌ Animated API for Complex Animations

```tsx
// ❌ NEVER — JS thread, drops frames under load
const opacity = useRef(new Animated.Value(0)).current;
Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

// ✅ ALWAYS — UI thread, frame-perfect
const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: 300 });
```

### ❌ AsyncStorage When MMKV is Available

```tsx
// ❌ NEVER (in bare/prebuild) — async, slow, unencrypted
await AsyncStorage.setItem('token', token);

// ✅ ALWAYS (bare/prebuild) — synchronous, ~30x faster
storage.set('token', token);
```

### ❌ Inline renderItem in FlashList

```tsx
// ❌ NEVER — new function on every parent render → all cells re-render
<FlashList renderItem={({ item }) => <Card item={item} onPress={() => navigate(item.id)} />} />

// ✅ ALWAYS — memoized renderItem and stable handlers
const handlePress = useCallback((id: string) => navigate(id), [navigate]);
const renderItem = useCallback(({ item }: { item: Item }) => (
  <Card item={item} onPress={handlePress} />
), [handlePress]);
<FlashList renderItem={renderItem} />
```

### ❌ useEffect for Derived State

```tsx
// ❌ NEVER — double render
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${firstName} ${lastName}`); }, [firstName, lastName]);

// ✅ ALWAYS — compute during render
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
```

### ❌ Reading Shared Values on the JS Thread

```tsx
// ❌ NEVER — blocks JS thread
const isVisible = opacity.value > 0;

// ✅ ALWAYS — use useAnimatedReaction + runOnJS
useAnimatedReaction(
  () => opacity.value > 0,
  (isVisible) => { if (isVisible) runOnJS(setIsVisible)(true); }
);
```

### ❌ StyleSheet.create Inside Component Body

```tsx
// ❌ NEVER — recreated on every render
function MyComponent() {
  const styles = StyleSheet.create({ box: { padding: 16 } }); // WRONG
  return <View style={styles.box} />;
}

// ✅ ALWAYS — at module level
const styles = StyleSheet.create({ box: { padding: 16 } });
function MyComponent() { return <View style={styles.box} />; }
```

### ❌ Index as List Key

```tsx
// ❌ NEVER — breaks reconciliation on reorder/deletion
items.map((item, index) => <Card key={index} item={item} />)

// ✅ ALWAYS — stable unique ID
items.map((item) => <Card key={item.id} item={item} />)
```

### ❌ Native Modules in Expo Go Without Warning

```tsx
// ❌ NEVER — silently breaks Expo Go
import { MMKV } from 'react-native-mmkv'; // JSI module, requires prebuild

// ✅ ALWAYS — document the constraint or use a compatible alternative
// If targeting Expo Go: use AsyncStorage and document migration plan.
// If using prebuild/bare: MMKV is preferred.
```

---

## 15. PRIORITY SYSTEM

### 🔴 CRITICAL (Always apply — non-negotiable)
- **NUNCA alterar o design visual, cores, tipografia ou espaçamentos sem aprovação explícita do usuário**
- Run the mandatory pre-code flow (analyze → research → validate → plan)
- New Architecture enabled; Hermes only
- FlashList v2 instead of FlatList/ScrollView for lists
- Reanimated 3 instead of Animated API for complex animations
- Gesture Handler instead of PanResponder
- No inline functions in JSX hot paths
- No StyleSheet.create inside component bodies
- TypeScript strict mode
- No native modules in Expo Go without explicit justification

### 🟠 RECOMMENDED (Apply in most cases)
- TanStack Query for all server state
- Zustand with selectors for global client state
- MMKV for storage (bare/prebuild workflow)
- `expo-image` with blurhash + `recyclingKey` in lists
- `InteractionManager.runAfterInteractions` for deferred work
- `React.memo` on all list item components
- Named/subpath imports for tree-shaking
- EAS Build + EAS Update pipeline with fingerprint CI check

### 🟡 OPTIONAL (Apply when appropriate)
- Moti for simple declarative entrance animations
- React Hook Form + Zod for complex forms
- WatermelonDB for offline-first relational data
- Re.Pack (Webpack) for advanced tree-shaking beyond Metro
- Sentry performance tracing with custom spans

---

## 16. QUICK REFERENCE — LIBRARY DECISIONS

> Legenda: ✅ instalado | 🔜 recomendado (não instalado) | ⚠️ avaliar antes de usar

| Concern | Use This | Status | Never Use This |
|---|---|---|---|
| Lists | `@shopify/flash-list` v2 | ✅ 2.0.2 | `FlatList`, `ScrollView` for lists |
| Lists (bottom sheet) | `BottomSheetFlashList` | ✅ (via @gorhom/bottom-sheet v5) | `FlatList` inside bottom sheet |
| Animations | `react-native-reanimated` v4 | ✅ ~4.1.1 | `Animated` API for complex cases |
| Worklets | `react-native-worklets` | ✅ 0.5.1 | — (companion obrigatório do Reanimated 4) |
| Gestures | `react-native-gesture-handler` | ✅ ~2.28.0 | `PanResponder` |
| Storage | `react-native-mmkv` | 🔜 (não instalado) | — |
| Storage (temporário/Expo Go) | `AsyncStorage` | ⚠️ avaliar workflow | JSI modules sem prebuild |
| Server state | `@tanstack/react-query` v5 | ✅ ^5.91.3 | `useEffect + useState` para fetch |
| Client state | `zustand` v5 | ✅ ^5.0.12 | `Context` para estado global de alta frequência |
| Images | `expo-image` | ✅ ~3.0.11 | built-in `Image`, `react-native-fast-image` |
| Navigation | `@react-navigation/native` v7 | ✅ ^7.1.17 | `expo-router` (não instalado) |
| Styling | `StyleSheet.create` | ✅ (padrão atual) | inline style objects em hot paths |
| Styling (futuro) | `NativeWind v5` | 🔜 (não instalado) | — |
| Forms | `react-hook-form` + `zod` | 🔜 (não instalado) | `useState` por campo |
| Build | `EAS Build` | ✅ (EAS project configurado) | `expo build` (legacy) |
| OTA | `EAS Update` + fingerprint | 🔜 | `expo publish` (legacy) |
| Engine | `Hermes` | ✅ (padrão SDK 54 + New Arch) | `JSC` |
| Crash reporting | `@sentry/react-native` | 🔜 (não instalado) | sem monitoramento em produção |

---

*Last updated: April 2026. Projeto KaAPP2 — Expo SDK ~54.0.0 / React Native 0.81.5 / New Architecture ON (`newArchEnabled: true`) / Reanimated 4.1.1 / React Navigation v7.*