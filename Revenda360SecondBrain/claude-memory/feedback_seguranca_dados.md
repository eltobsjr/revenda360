---
name: feedback-seguranca-dados
description: "Regra suprema do projeto — segurança de dados vem antes de velocidade, autonomia de commit ou qualquer outra regra"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1c59cee9-8a0e-49ed-be1a-a2fb6d8153d5
  modified: 2026-08-05T12:24:54.892Z
---

Segurança de dados é a prioridade máxima do Revenda360 — acima de velocidade, da autonomia de commit sem permissão ([[feedback_commit_autonomo]] se existir, ou ver `feedback_rules.md`) e de qualquer outra regra do projeto. Em conflito entre "seguir rápido" e "proteger dado", vence proteger dado, sempre.

Aplicação concreta:
- RLS (`tenant_id` + policy `current_tenant_id()`) nasce junto com a tabela, na mesma migration — nunca como "ajuste futuro".
- Dado sensível (preço mínimo, margem, custo de aquisição, comissão, qualquer dado financeiro interno, CPF/dado pessoal de cliente) só chega a quem tem role autorizada, filtrado em `lib/data/*` — nunca só escondido no componente visual.
- Segredo (chave de API, senha, service role key) nunca vai pro git, nem "temporário pra testar".
- A autonomia de commitar sem pedir permissão **não vale** quando a mudança toca segurança (RLS, auth, autorização, exposição de dado sensível, segredo) — nesses casos, parar e descrever antes de commitar, mesmo com testes verdes.
- Ao notar qualquer exposição de dado sem o filtro certo — mesmo fora do escopo da tarefa atual — avisar antes de seguir, nunca corrigir silenciosamente nem ignorar.

**Why:** Instrução explícita do usuário em 2026-08-05, dada como "regra suprema" logo depois de liberar a autonomia de commit sem permissão — sinal de que a liberação de autonomia não deveria ter sido interpretada como "vale tudo", e que segurança é o limite inegociável dessa autonomia.
**How to apply:** Vale em qualquer sessão deste projeto, inclusive nas fases do guia de construção (`Revenda360SecondBrain/prioridade/guia-construcao-enzo.md`) que o Enzo vai rodar sozinho com o Claude Code — por isso o bloco de regras embutido em cada prompt daquele guia já reforça isso explicitamente. `CLAUDE.md` (seção 0) é a fonte de verdade formal desta regra.
