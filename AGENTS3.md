# AGENTES3.md — Validação Visual e Análise Segura do App Expo Go

## Contexto do projeto

Este projeto é um aplicativo mobile desenvolvido em **React Native com Expo SDK 54**, executado no celular Android físico do desenvolvedor através do **Expo Go**.

O ambiente atual possui:

- VS Code no PC
- Claude Code como agente de programação
- Expo Go rodando o aplicativo KaAPP2 no celular Android físico
- Metro Bundler iniciado com `npx expo start`
- ADB autorizado e conectado ao celular
- `agent-device` instalado e funcionando
- React Native DevTools funcionando ao pressionar `j` no terminal do Expo, após o app estar aberto no Expo Go

O objetivo deste arquivo é orientar o agente a usar esses recursos apenas para **validação visual, análise da interface e inspeção do estado do aplicativo em desenvolvimento**, sem alterar nada no smartphone fora do contexto do app Expo Go.

---

## Regra principal de segurança

O agente **NÃO tem permissão para modificar, configurar, apagar, instalar, desinstalar ou alterar qualquer coisa no smartphone físico do usuário**.

O celular deve ser tratado apenas como um dispositivo de visualização e validação do aplicativo em desenvolvimento.

O agente pode observar e analisar somente:

- A tela do aplicativo KaAPP2 aberto no Expo Go
- O estado visual da interface
- A árvore de acessibilidade da tela atual
- Screenshots do aplicativo em execução
- Informações disponíveis no React Native DevTools relacionadas ao app
- Logs e mensagens do Metro/Expo relacionados ao app

O agente **não pode**:

- Abrir aplicativos pessoais do usuário sem autorização explícita
- Ler, alterar ou apagar arquivos do smartphone
- Acessar fotos, mensagens, contatos, notificações, contas ou configurações pessoais
- Instalar ou desinstalar aplicativos
- Alterar configurações do Android
- Mexer em permissões do sistema
- Executar comandos ADB destrutivos
- Reiniciar, bloquear, desbloquear ou limpar dados do aparelho
- Usar o smartphone para qualquer tarefa fora da validação do app Expo Go

---

## Fluxo correto para validação do app

Antes de usar ferramentas de validação, confirme que o app está rodando corretamente:

1. O Metro deve estar iniciado:

```bash
npx expo start
```

2. O usuário deve abrir o app no celular usando o QR Code do Expo Go.

3. O app KaAPP2 deve estar visível e ativo no celular.

4. Somente depois disso o agente pode usar comandos de inspeção e validação.

---

## Comandos permitidos para validação visual

O agente pode usar o `agent-device` apenas para observar o app em execução.

Comandos permitidos:

```bash
adb devices
```

Uso permitido: verificar se o celular está conectado e autorizado.

```bash
agent-device apps --platform android
```

Uso permitido: confirmar que o dispositivo está acessível. Não abrir outros apps pessoais sem necessidade.

```bash
agent-device snapshot -i --platform android
```

Uso permitido: capturar a árvore de acessibilidade/interação da tela atual do app Expo Go.

```bash
agent-device screenshot tela-kaapp2.png --platform android
```

Uso permitido: capturar screenshot da tela atual para validação visual do app.

O agente deve preferir `snapshot -i` antes de screenshots, porque snapshots são mais leves e seguros.

---

## Comandos proibidos

Não execute comandos que modifiquem o smartphone, como:

```bash
adb install
adb uninstall
adb shell rm
adb shell settings
adb shell pm clear
adb shell input keyevent POWER
adb reboot
adb shell am force-stop
agent-device uninstall
agent-device install
```

Também não execute comandos de toque, digitação ou navegação fora do app em desenvolvimento sem autorização explícita do usuário.

Se precisar tocar em algo na tela do app, limite-se ao fluxo do KaAPP2 dentro do Expo Go.

---

## Uso do React Native DevTools

O React Native DevTools pode ser usado para analisar o estado interno do app.

Fluxo correto:

1. Abrir o app no Expo Go pelo QR Code.
2. Esperar o app conectar ao Metro.
3. Pressionar `j` no terminal do Expo.
4. Usar as abas:
   - Components
   - Console
   - Network/Expo
   - Profiler

O agente pode analisar:

- Árvore de componentes React
- Props
- Hooks
- Estado interno
- Contextos
- Renders
- Possíveis gargalos de performance
- Logs relacionados ao app

O agente não deve usar DevTools para executar código arbitrário que altere dados pessoais ou configurações do aparelho.

---

## Como validar alterações feitas no código

Após alterar código de interface, componente, navegação, layout ou estado visual, o agente deve validar o resultado.

Fluxo recomendado:

1. Alterar o código necessário.
2. Aguardar o Fast Refresh/Metro recompilar.
3. Confirmar que o app continua aberto no Expo Go.
4. Executar:

```bash
agent-device snapshot -i --platform android
```

5. Analisar se os elementos esperados aparecem na tela.
6. Se necessário, capturar screenshot:

```bash
agent-device screenshot tela-kaapp2.png --platform android
```

7. Verificar no React Native DevTools se o componente e estado estão corretos.
8. Corrigir o código caso a validação mostre problema.
9. Repetir o ciclo até a tela estar correta.

---

## Critérios de validação visual

Ao validar uma tela, observar:

- Componentes renderizados corretamente
- Textos visíveis e sem cortes
- Botões acessíveis e identificáveis
- Espaçamentos consistentes
- Layout responsivo ao tamanho da tela real
- Contraste e legibilidade
- Navegação correta
- Ausência de overflow visual
- Ausência de elementos sobrepostos
- Estado correto após interação
- Nenhum erro no Console/Metro

---

## Postura esperada do agente

O agente deve agir de forma conservadora e segura.

Sempre que precisar validar algo no celular, o agente deve deixar claro que está apenas observando ou interagindo com o app KaAPP2 no Expo Go.

Se uma ação exigir sair do app, abrir outro aplicativo, alterar configuração do Android ou acessar dados pessoais, o agente deve parar e pedir autorização explícita ao usuário.

A prioridade é proteger o smartphone do usuário.

---

## Resumo operacional

O agente pode:

- Validar visualmente o app KaAPP2 no Expo Go
- Usar snapshots do `agent-device`
- Usar screenshots do app
- Usar React Native DevTools para analisar componentes e estado
- Ler logs do Metro/Expo
- Corrigir código do projeto com base nessas validações

O agente não pode:

- Modificar o smartphone
- Acessar dados pessoais
- Alterar configurações do Android
- Instalar/desinstalar apps
- Executar comandos destrutivos via ADB
- Interagir com apps que não sejam o Expo Go/KaAPP2 sem autorização explícita

---

## Instrução final para o agente

Use o celular físico apenas como uma janela segura de validação do app em desenvolvimento.

Seu trabalho é melhorar o código do projeto e validar o resultado no KaAPP2 rodando no Expo Go, sem causar qualquer alteração no smartphone do usuário.
