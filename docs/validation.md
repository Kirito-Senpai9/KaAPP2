# Validação das correções — Expo SDK 54

Data: 10/10/2026. Alvo: Expo Go no Android. Backend, autenticação real, persistência, migração de SDK e migração principal do Carousel continuam fora desta rodada.

## Implementação e versões

A aplicação permanece em Expo 54.0.37, React Native 0.81.5, React 19.1.0, Reanimated 4.1.6, Worklets 0.5.1, Gesture Handler 2.28.0, FlashList 2.0.2 e Bottom Sheet 5.2.8. Foram mantidos expo-video 3.0.16, expo-image 3.0.11 e expo-image-picker 17.0.11. Nenhuma dependência nativa nova foi adicionada.

Foram corrigidos reprodução por foco/AppState/visibilidade, retorno do Kzone, relógio de Stories, estados de células recicladas, árvores de comentários, execução do compartilhamento após dismiss, editor de perfil, safe areas e seleção de mídia. Os dados continuam em memória e os fluxos de demonstração mantêm suas limitações.

## Verificações

| Verificação | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Passou, sem erros. |
| `npm.cmd test` | 33 testes passaram, nenhum ignorado ou com falha. |
| `npx.cmd expo install --check` | Versões alinhadas ao SDK 54. |
| `npx.cmd --yes expo-doctor` | 18/18 checks passaram. |
| `npm.cmd ls --all --json` | Nenhum problema de dependências registrado no grafo. |
| `npm.cmd audit --json` | Executado; 37 alertas restantes, detalhados abaixo. |
| `npx.cmd expo export --platform android --output-dir .expo/validation-android --max-workers 2` | Passou, 1.605 módulos e bundle Hermes gerado. CI/offline habilitados. |
| `git diff --check` | Passou. |

Os testes cobrem identidade/referências por ID, ordenação e respostas com ancestrais recolhidos, travessia de árvore com 5.000 níveis, relógio de Stories, eventos atrasados, avanço único do relógio, duração e metadados de vídeo, compartilhamento por plataforma/fila e transformações de enquadramento. São testes de regras e estado, não testes nativos de interface. O Node emite o aviso `MODULE_TYPELESS_PACKAGE_JSON` ao interpretar os módulos TypeScript; não há falha e a configuração CommonJS de Babel/Metro foi preservada.

A busca final não encontrou `Dimensions.get`, `MediaTypeOptions`, `InteractionManager`, `onScrollToIndexFailed`, `BottomSheetFlashList` ou imports agregados de ícones em `src`. As listas migradas usam FlashList v2. Permanece um `BottomSheetFlatList` no menu fixo de quatro opções de status do perfil, fora das listas críticas migradas.

## Comparação dos artefatos Android

Tamanhos em bytes, obtidos de `metadata.json` e dos arquivos gerados. O baseline foi exportado durante a auditoria para `.expo/audit-android`; o resultado atual está em `.expo/validation-android`. Ambos são artefatos locais ignorados pelo Git.

| Métrica | Auditoria anterior | Após correções |
| --- | ---: | ---: |
| Bundle Hermes | 4.882.048 | 4.764.494 |
| Módulos Metro | 1.646 | 1.605 |
| Arquivos de assets únicos | 36 | 19 |
| Bytes de assets únicos | 4.083.139 | 1.703.683 |
| Fontes empacotadas | 19 | 2 |
| Bytes das fontes | 4.076.840 | 1.697.384 |

Os imports das famílias Ionicons e MaterialCommunityIcons eliminaram as demais fontes do pacote. A contagem deduplica caminhos de assets; mídias remotas dos mocks não fazem parte destes totais. A redução de tamanho não equivale a uma medição de FPS ou tempo de abertura.

## Segurança

O `npm audit --json` passou de **47** pacotes sinalizados (1 crítico, 26 altos, 19 moderados e 1 baixo) para **37** (0 críticos, 23 altos, 14 moderados e 0 baixos). O comando ainda termina com código 1 pelos alertas restantes; não é uma auditoria sem vulnerabilidades. A contagem inclui propagação do mesmo advisory para dependentes, não 37 falhas independentes.

O lockfile resolveu `shell-quote` em **1.12.0**, versão compatível mais recente que o mínimo 1.9.0 previsto, e `@xmldom/xmldom` em **0.8.15**. Outras atualizações compatíveis incluíram Babel, browserslist, baseline-browser-mapping, nanoid, yaml e internos do React Navigation. A cadeia antiga query-string/decode-uri-component foi removida pela atualização compatível de navegação. Não foi usado `npm audit fix --force` nem override de versões exigidas pelo SDK.

Alertas de origem que permanecem no grafo:

| Pacote instalado | Contexto e decisão | Referências |
| --- | --- | --- |
| braces 3.0.3 | Dependência de micromatch/Metro/Jest. Advisory sem versão corrigida upstream na data da verificação. | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) |
| image-size 1.2.1 | Metro exige ^1.0.2; a correção publicada está na série 2 (2.0.3). Não forçada sobre a API esperada pelo Metro. | [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) |
| node-forge 1.4.0 | CLI Expo/certificados de assinatura. Advisory sem versão corrigida upstream na data da verificação. | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) |
| postcss 8.4.49 | @expo/metro-config exige ~8.4.32. Correções dos advisories estão na série 8.5; aguardam atualização compatível do pacote pai. | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) |
| sprintf-js 1.0.3 | Cadeia argparse/js-yaml usada por ferramentas de teste. Advisory sem versão corrigida upstream na data da verificação. | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) |
| uuid 7.0.3 | xcode exige ^7.0.3. Correção requer outra série; não feita substituição incompatível. | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |

As cadeias locais indicam predominantemente ferramentas de desenvolvimento/build. Isso não prova ausência de risco: não foi realizada análise de exploração de cada caminho. As sugestões automáticas do audit incluem versões de Expo/React Native fora da matriz autorizada. Reavaliar patches upstream e uma futura atualização de SDK separadamente.

## Critérios adotados

Três armadilhas tratadas: efeitos de reprodução que reiniciam mídia ao mudar pausa/mute; estado local transferido entre IDs por reciclagem; callbacks atrasados ou duplicados que avançam/contabilizam ações incorretamente.

Referências de implementação: [Expo Video SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/video/), [Expo ImagePicker SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/), [Babel Expo](https://docs.expo.dev/versions/v54.0.0/config/babel/), [FlashList v2](https://shopify.github.io/flash-list/docs/v2-changes/), [integração FlashList do Bottom Sheet](https://gorhom.dev/react-native-bottom-sheet/components/bottomsheetflashlist), [AppState](https://reactnative.dev/docs/0.81/appstate), [Share](https://reactnative.dev/docs/0.81/share). A integração usa `useBottomSheetScrollableCreator`, exportado pela versão instalada, com `renderScrollComponent`; não usa o wrapper depreciado.

## Limitações e validação manual

Não foi possível executar testes em aparelho/emulador Android neste ambiente (ADB/SDK Android não disponíveis). Permanecem pendentes troca de abas/background com vídeo, dezenas de itens reciclados, teclado e respostas, rede lenta, rotação, pan/pinça e navegação Android por gestos/três botões. O roteiro está no README.

Contagens de renders, FPS, memória e frames perdidos não foram medidas na auditoria nem nesta implementação. A mudança elimina atualizações React periódicas de progresso e clonagens repetidas por inspeção de código; ganhos numéricos de fluidez não são apresentados como medidos.

