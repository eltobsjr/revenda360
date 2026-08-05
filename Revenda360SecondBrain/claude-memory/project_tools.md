---
name: project-tools
description: Ferramentas de colaboração e rastreamento de tarefas da equipe do Revenda360
metadata: 
  node_type: memory
  type: reference
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-05T12:38:55.423Z
---

**Issue tracker:** nenhum — trabalho com tasks soltas, guiado pelo plano de fases documentado (`Revenda360SecondBrain/prioridade/atual.md`).
**Tamanho da equipe:** pequena (2-5 pessoas). **Enzo** (git author `kenjizxst <enzimbenevides@gmail.com>`, contato pessoal em [[project_contato_enzo]]) é colaborador ativo com push direto em `main` — não só stakeholder de negócio. Constrói fases usando o próprio Claude Code dele, seguindo `Revenda360SecondBrain/prioridade/guia-construcao-enzo.md` (guia com prompt pronto por fase, criado em 2026-08-05 especificamente porque ele não programa por conta própria).
**Especificações de feature:** sem HUs/RFCs formais por enquanto — o plano de fases (Fase 0-6 + pós-MVP, ordenado por tier em `prioridade/atual.md`) serve de guia funcional.

**Why:** Contexto de colaboração registrado no setup do SecondBrain (2026-08-01); ampliado em 2026-08-05 depois que um commit do Enzo (`8e3051b`, painel administrativo) apareceu no remoto sem ter passado por uma sessão de Claude Code — revelou que ele já tinha push direto, não só era consultado.
**How to apply:** Ao planejar uma nova fase ou funcionalidade, não esperar por ticket formal — seguir a ordem já definida em `prioridade/atual.md` e confirmar com o usuário antes de iniciar cada fase nova. Ao começar uma sessão, sempre rodar `git fetch` e checar se há commit do Enzo no remoto ainda não auditado (ele pode commitar/pushar direto, fora de uma sessão observada).
