---

# INSTRUÇÕES OBRIGATÓRIAS PARA O AGENTE CODEX (AGENTS.md)

## Fluxo obrigatório ANTES de qualquer alteração de código

Antes de escrever, editar ou gerar qualquer linha de código, o Codex DEVE seguir esta sequência completa:

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
