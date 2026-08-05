---
name: feedback-rules
description: Regras e convenções de desenvolvimento definidas pelo usuário para o Revenda360
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-05T11:52:01.340Z
---

**Pode commitar sem pedir permissão a cada vez — inclusive ao terminar uma fase inteira — desde que passe antes pela verificação obrigatória (typecheck + lint + build) e pelos testes automáticos (unitários + E2E), todos limpos.** Regra dada em 2026-08-01 ("quando acabar commita, pusha, e ja começa a fazer as proximas fases") e reconfirmada em 2026-08-05 com a condição explícita da verificação/testes — **substitui** a regra anterior de "nunca commitar sem permissão explícita". `CLAUDE.md` já reflete essa versão (atualizado em 2026-08-05; até então estava desatualizado/conflitante com esta memória). Push para o remoto (repositório público no GitHub) segue sendo avaliado caso a caso — confirmar antes de pushar fora do fluxo já validado de "terminei uma fase". Continua valendo pedir confirmação para ações fora desse fluxo (force-push, reset, deletar branch, etc.).

**Nunca incluir "Co-Authored-By: Claude" ou qualquer assinatura similar nos commits deste projeto** — isso sobrepõe a instrução padrão de assinatura de commits para este repositório específico.

**Toda tela nova construída (Fase 1 em diante) deve nascer com teste E2E Playwright**, seguindo o padrão já estabelecido em `e2e/fase0.spec.ts`: usar os helpers de Admin API (`e2e/helpers/admin.ts`) para criar/confirmar/limpar dados de teste sem depender de e-mail real quando possível (o Supabase free tier tem rate limit baixo de envio de e-mail).

**Ajustes de design (cor, tipografia, altura de campo, espaçamento) sempre nos componentes compartilhados** (`components/ui/*`, `app/globals.css`, layouts compartilhados como `auth-split-layout.tsx`), nunca só numa tela isolada — é o que garante que a correção se propague para toda a plataforma, incluindo telas ainda não construídas. Confirmado como abordagem correta pelo usuário após auditoria de propagação (grep + inspeção visual).

**Ao implementar uma regra de negócio que o protótipo original demonstra de forma ambígua ou inconsistente (ex.: dado de exemplo não bate com a fórmula real do código), ler o código-fonte do protótipo (`Revenda360.dc.html`) em vez de confiar só nos dados de exemplo (`revenda-data.js`) — os dados de exemplo às vezes são digitados à mão e não refletem a fórmula que o app realmente calcula.** Confirmado na Fase 4: os dados de contrato de crediário do protótipo mostravam parcelas redondas sem juros embutido, mas o código-fonte da função `gerarParcelas` do protótipo tinha uma fórmula de juros simples real — usar a fórmula do código, não os números do seed de demonstração.

**Why:** Regras explicitadas pelo usuário ao longo da sessão de construção do MVP (Fases 0-4), algumas em resposta direta a perguntas de setup do SecondBrain, outras como correção/reforço durante o trabalho, e uma aprendida investigando uma discrepância entre dado de exemplo e fórmula real do protótipo.
**How to apply:** Seguir sempre, em qualquer tarefa, sem exceção salvo instrução explícita do usuário no momento. Ver [[feedback_design_system]] para o detalhe do que foi ajustado no design system.
