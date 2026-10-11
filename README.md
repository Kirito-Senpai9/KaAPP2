# KaAPP2

Aplicativo React Native com Expo SDK 54, React Native 0.81 e React 19.1. O alvo principal é Expo Go no Android, com a nova arquitetura habilitada.

## Estrutura

- `index.tsx` registra o aplicativo; `src/App.tsx` encaminha para `src/app/AppRoot.tsx`.
- `src/app` contém providers, QueryClient e navegação tipada em `navigation`.
- `src/features/<domínio>` organiza entidades e contratos em `domain`, casos de uso em `application`, repositórios em `infrastructure` e telas, componentes, hooks e stores em `presentation`.
- `src/shared` contém utilitários e hooks comuns. `tests` contém regressões de regras e estado, executadas com o runner do Node.

## Executar

Use Node 22.23 ou uma versão compatível com execução de TypeScript por remoção de tipos. Instale as versões do lockfile com `npm ci`, depois execute:

```sh
npm start
```

No Windows com restrição de execução do PowerShell, use `npm.cmd` e `npx.cmd`. Use uma versão do Expo Go compatível com SDK 54; versões para Android estão disponíveis em [expo.dev/go](https://expo.dev/go).

`npm run android` e `npm run ios` geram/executam projetos nativos e precisam dos respectivos ambientes. Não são necessários para testar pelo Expo Go. `npm run web` inicia a versão web.

## Verificações

```sh
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
npm audit
npx expo export --platform android --output-dir .expo/validation-android
```

Os testes `.test.mjs` importam regras TypeScript diretamente. Não altere o projeto para `type: module`: Babel e Metro mantêm configuração CommonJS. O aviso do Node sobre módulos TypeScript sem tipo explícito de pacote não representa falha dos testes.

## Regras de desempenho

- Reprodução considera foco da tela, AppState, foco da janela Android e visibilidade. A perda de elegibilidade pausa a mídia; a pausa manual permanece associada ao item.
- Players são limitados às mídias relevantes; fontes remotas de vídeo usam o cache de `expo-video`. Cache pode ser removido pelo sistema e não serve como persistência de conteúdo.
- Listas críticas usam FlashList v2. Bottom sheets integram a lista por `useBottomSheetScrollableCreator`. Estados temporários acompanham a reciclagem; interações usam IDs e seletores pequenos de Zustand.
- Progresso de mídia usa Reanimated; imagens repetidas usam `expo-image` e chaves de reciclagem.
- Dados dos repositórios permanecem no React Query. As fixtures usam `staleTime: Infinity`; antes de integrar uma API real, definir invalidação, reconexão e estados de erro/carregamento conforme o produto.

## Limitações do protótipo

O login navega para o aplicativo sem autenticação real. Publicação e várias ações sociais continuam como demonstrações, sem backend. Repositórios `mock*`, alterações de perfil e interações ficam em memória e são perdidos ao reiniciar o processo. Mídias selecionadas podem usar URIs temporárias. Nenhuma destas estruturas representa armazenamento permanente.

No Android, abrir o seletor externo de compartilhamento não confirma entrega; por isso essa ação não aumenta o contador. O envio interno simulado continua com seu comportamento atual.

## Validação em aparelho

Os checks de código e exportação não substituem estes testes no Android:

1. Alternar Home, Kzone, Shorts, perfil e Live com vídeo em andamento; abrir a cortina de notificações e enviar o app ao background. Verificar pausa e ausência de áudio concorrente.
2. Em um Story de cinco segundos, assistir três segundos, pausar, retomar e verificar os dois segundos restantes. Repetir com teclado, menus, mute, rede lenta, erro e tentativa novamente.
3. Exercitar listas com dezenas de itens, curtir/pausar itens distintos, trocar filtros e revisitar itens. Conferir isolamento de estado, teclado e scroll de respostas aninhadas.
4. Editar foto/banner com pan e pinça, girar sem salvar e conferir enquadramento. Testar scroll e long press nas estatísticas.
5. Selecionar mídia com acesso amplo à galeria negado, cancelar o seletor e testar vídeo curto, longo, sem duração e com erro. Sair da tela durante a validação.
6. Testar retrato/paisagem e navegação Android por gestos e três botões. Comparar visual, montagens, players, memória e frames nas mesmas condições.

Medições finais de desempenho devem usar uma build release; resultados em desenvolvimento têm custos adicionais. Não atribuir ganhos percentuais sem medição no dispositivo.

## Segurança das dependências

Preservar a matriz do SDK 54 ao atualizar dependências. Não usar `npm audit fix --force`: sugestões automáticas podem selecionar Expo ou React Native incompatíveis. A contagem do audit inclui pacotes afetados por dependências transitivas e não comprova exploração no app.

Os resultados desta rodada e as limitações da validação estão em [docs/validation.md](docs/validation.md).
