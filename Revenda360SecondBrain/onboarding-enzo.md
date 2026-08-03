# Onboarding — Enzo

Guia rápido pra clonar o Revenda360 e continuar de onde a última sessão parou, usando o Claude Code com todo o contexto já registrado no projeto.

## 1. Clonar e instalar

```bash
git clone https://github.com/eltobsjr/revenda360.git
cd revenda360
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do Supabase — **peça esses valores direto pro Elto** (WhatsApp/outro canal seguro). Elas nunca ficam no git (`.env*` é ignorado de propósito), então não tem como pegar isso clonando o repo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (nunca expor no client — só uso server-side)
- `NEXT_PUBLIC_SITE_URL` (opcional em localhost)

## 3. Rodar o projeto

```bash
npm run dev        # http://localhost:3000
npm test            # Vitest (unitário)
npm run test:e2e   # Playwright (precisa do dev server rodando)
npm run lint
npm run build
```

## 4. Abrir o Claude Code na pasta do projeto e colar este prompt

O repositório já tem tudo que o Claude precisa pra saber o estado atual: `CLAUDE.md`/`AGENTS.md` (regras do projeto), `Revenda360SecondBrain/` (vault de decisões e devtrack de cada sessão) e `Revenda360SecondBrain/claude-memory/` (cópia da memória persistente da sessão original). Colar isto como primeira mensagem:

```
Lê o CLAUDE.md e o AGENTS.md, depois o índice de memória em
Revenda360SecondBrain/claude-memory/MEMORY.md (e os arquivos linkados nele),
o devtrack mais recente em Revenda360SecondBrain/devtrack/ (pega o de data
mais alta) e Revenda360SecondBrain/prioridade/atual.md. Depois me diz, em
poucas linhas: o que já foi implementado, o que ainda falta, e qual é a
próxima frente de trabalho recomendada. Não implementa nada ainda, só me
dá esse resumo primeiro.
```

Isso coloca o Claude no mesmo nível de contexto que a sessão original tinha antes de parar — sem precisar reexplicar o projeto do zero.

## Estado no momento em que este guia foi gerado (2026-08-03)

- MVP completo: as 6 fases do plano original (Fundação, Estoque, Entrada de veículo, Clientes, Nova venda, Contas a receber, Dashboard) estão implementadas e testadas (46/46 vitest, 18/18 e2e, typecheck/lint/build limpos).
- Prioridade nº 1 pendente: **painel administrativo do dono da plataforma** — hoje provisionar uma revenda cliente nova é manual (SQL/Admin API), porque o autocadastro público foi removido de propósito (o dono da plataforma provisiona os clientes, eles não se cadastram sozinhos).
- Lista completa de pendências pós-MVP em `Revenda360SecondBrain/prioridade/atual.md`.
