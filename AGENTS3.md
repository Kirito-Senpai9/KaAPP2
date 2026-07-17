

Harness de Validação Mobile para KaAPP2

Objetivo

Este projeto utiliza um Harness de validação visual e funcional baseado em:

- Expo Go
- React Native DevTools
- agent-device
- android-scrcpy MCP
- ADB
- Celular Android físico

O objetivo dessas ferramentas é permitir que agentes de IA validem alterações realizadas no aplicativo KaAPP2 em tempo real, sem necessidade de emuladores Android.

---

Escopo permitido

O alvo exclusivo de validação é:

Expo Go
└── KaAPP2

O agente deve considerar o KaAPP2 executado dentro do Expo Go como o único ambiente autorizado para observação, interação e validação.

---

Ferramentas disponíveis

React Native DevTools

Utilizar para:

- Árvore de componentes React
- Props
- Hooks
- Estado interno
- Contextos
- Renders
- Possíveis gargalos de performance
- Logs relacionados ao app

O agente não deve utilizar DevTools para executar código arbitrário que altere dados pessoais, configurações do aparelho ou informações externas ao KaAPP2.

---

agent-device

Utilizar para:

- Snapshots estruturados
- Captura de screenshots
- Identificação textual da interface
- Validação de elementos visíveis
- Confirmação de mudanças visuais

Comandos recomendados:

agent-device snapshot -i --platform android

agent-device screenshot tela-kaapp2.png --platform android

---

android-scrcpy MCP

Utilizar para:

- Visualização em tempo real
- Operação controlada da interface
- Reprodução de bugs
- Validação comportamental
- Testes de navegação
- Execução de fluxos de usuário
- Validação de correções dependentes de interação

O android-scrcpy MCP existe exclusivamente para melhorar a validação visual e funcional do KaAPP2.

Ele não deve ser utilizado para administrar, explorar ou modificar o smartphone do usuário.

---

Quando utilizar android-scrcpy MCP

Utilize o android-scrcpy MCP quando for necessário:

- Reproduzir bugs dependentes de interação
- Navegar entre telas
- Acionar botões
- Abrir modais
- Fazer scroll
- Digitar em campos
- Validar animações
- Testar fluxos completos de navegação
- Confirmar correções que dependem de ações do usuário
- Investigar problemas que só aparecem durante a execução real da interface

---

Como validar alterações feitas no código

Após alterar código de interface, componente, navegação, layout ou estado visual, o agente deve validar o resultado.

Fluxo recomendado:

1. Alterar o código necessário.
2. Aguardar o Fast Refresh ou recompilação do Metro.
3. Confirmar que o app continua aberto no Expo Go.
4. Utilizar React Native DevTools para validar estado interno.
5. Executar:

agent-device snapshot -i --platform android

6. Analisar os elementos presentes na tela.
7. Se necessário, capturar screenshot:

agent-device screenshot tela-kaapp2.png --platform android

8. Caso o bug dependa de interação, utilizar android-scrcpy MCP para reproduzir o fluxo.
9. Confirmar visualmente o comportamento esperado.
10. Corrigir o código caso necessário.
11. Repetir o ciclo até a validação ser concluída.

---

Critérios de validação visual

Ao validar uma tela observar:

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
- Nenhum erro no Console ou Metro
- Comportamento correto durante animações
- Comportamento correto durante scroll
- Comportamento correto durante transições de tela

---

Ordem de prioridade das ferramentas

1. React Native DevTools
2. agent-device
3. android-scrcpy MCP
4. Screenshots
5. Logs Metro/Expo

---

Restrições obrigatórias

O agente NÃO pode:

- Abrir aplicativos fora do Expo Go
- Alterar configurações do Android
- Instalar aplicativos
- Desinstalar aplicativos
- Modificar arquivos do smartphone
- Interagir com notificações
- Ler notificações
- Expandir notificações
- Acessar contatos
- Acessar mensagens
- Acessar contas do dispositivo
- Acessar arquivos pessoais
- Navegar livremente pelo Android
- Executar comandos destrutivos via ADB

---

Aplicativos proibidos

O agente não pode abrir ou interagir com:

- WhatsApp
- Chrome
- Configurações
- Galeria
- Arquivos
- Gmail
- Mensagens
- Contatos
- Discord
- Aplicativos bancários
- Redes sociais
- Qualquer aplicativo diferente do Expo Go

---

Operações destrutivas

Mesmo dentro do KaAPP2, o agente não deve executar ações destrutivas sem autorização explícita.

Exemplos:

- Excluir conta
- Apagar dados
- Limpar banco de dados
- Resetar configurações
- Remover informações do usuário
- Logout global
- Qualquer operação irreversível

Nesses casos o agente deve solicitar confirmação antes de prosseguir.

---

Segurança obrigatória

Caso a interação saia do Expo Go ou do KaAPP2, o agente deve interromper imediatamente a operação e solicitar autorização explícita do usuário.

A prioridade máxima é preservar a integridade do smartphone do usuário.

---

Postura esperada do agente

O agente deve agir de forma conservadora, segura e previsível.

O celular físico deve ser tratado exclusivamente como um ambiente de validação do aplicativo KaAPP2.

O agente está autorizado a:

- Observar o KaAPP2 em execução
- Navegar entre telas do KaAPP2
- Acionar botões do KaAPP2
- Executar fluxos necessários para reproduzir bugs
- Validar correções implementadas
- Capturar snapshots
- Capturar screenshots
- Utilizar React Native DevTools
- Utilizar agent-device
- Utilizar android-scrcpy MCP para validação controlada

---

Instrução final

Use o smartphone apenas como um ambiente seguro de validação do KaAPP2 executado dentro do Expo Go.

Toda observação, interação e validação deve ocorrer exclusivamente dentro do contexto:

Expo Go
└── KaAPP2

Qualquer ação fora desse escopo exige autorização explícita do usuário.

O objetivo principal é melhorar o código do projeto, reproduzir bugs, validar correções e garantir a qualidade da experiência do usuário sem causar alterações indevidas no smartphone.