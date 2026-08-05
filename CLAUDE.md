@AGENTS.md

# CLAUDE.md — Revenda360

## 0. Regra suprema: segurança de dados vem antes de tudo

**Segurança dos dados é a prioridade máxima deste projeto — acima de velocidade, autonomia de commit e qualquer outra regra deste arquivo.** Em caso de conflito entre "seguir rápido" e "proteger dado", vence proteger dado, sempre. Concretamente:

- **RLS nunca é opcional nem "depois eu arrumo"**: toda tabela nova nasce com `tenant_id` + policy `current_tenant_id()` já na mesma migration que cria a tabela — nunca numa migration futura "de ajuste".
- **Dado sensível (preço mínimo, margem, custo de aquisição/valor de compra, comissão, qualquer dado financeiro interno, CPF/dados pessoais de cliente) só chega a quem tem role autorizada** — filtrado em `lib/data/*` (nunca só escondido no componente visual, que é filtro cosmético e não segurança real).
- **Segredo nunca vai pro git**: chave de API, senha, service role key — nem em migration, nem em script, nem em commit "temporário pra testar". Se um script precisa de segredo (ex.: senha de conta), ele fica fora do controle de versão (ver `.gitignore`), sempre.
- **A autonomia de commitar sem pedir permissão (regra 5) não vale se a mudança tocar segurança** (RLS, autenticação, autorização, exposição de dado sensível, segredo) — nesses casos, mesmo com testes passando, pare e descreva o que vai mudar antes de commitar, para o usuário confirmar.
- Ao encontrar uma tabela, rota, ou tela que exponha dado sem o filtro certo — mesmo que não seja o que você estava construindo — **avise antes de seguir**, não conserte silenciosamente e não ignore.

## 1. Sempre ler a memória antes de começar

Ao iniciar qualquer conversa neste projeto:

1. Leia o índice de memória persistente do Claude Code (local, fora do
   repositório) na pasta de memória deste projeto. Se essa pasta ainda não
   existir ou estiver vazia (ex.: clone novo do repositório em outra
   máquina/usuário), use em vez disso `Revenda360SecondBrain/claude-memory/MEMORY.md`
   — é uma cópia exportada da memória, versionada no repositório exatamente
   para dar contexto completo a um clone novo. É um índice — siga os links
   para os arquivos relevantes à tarefa atual.

2. Leia o devtrack mais recente:
   `ls Revenda360SecondBrain/devtrack/ | sort | tail -1`
   e leia o arquivo retornado. Isso garante continuidade: o que foi feito,
   decisões tomadas e pendências abertas na última sessão.

3. Leia o plano de fases: `Revenda360SecondBrain/Revenda360 — Visão Geral.md` e
   `Revenda360SecondBrain/prioridade/atual.md`.

## 2. Stack e tecnologias

- Next.js 16 (App Router) + TypeScript + Turbopack
- Supabase (Postgres, Auth via `@supabase/ssr`, Storage) — SaaS multi-tenant com RLS
- Tailwind CSS v4 + shadcn/ui (preset "nova", base neutra + 4 temas de marca)
- next-themes (claro/escuro), lucide-react (ícones)
- Vitest (unitário) + Playwright (E2E)
- npm como package manager

## 3. Estrutura do projeto

- `app/(auth)/` — login, cadastro (rotas públicas)
- `app/onboarding/` — criação de tenant + primeira loja + perfil gestor
- `app/(app)/` — rotas autenticadas (Dashboard, Estoque, Vendas, Financeiro, Cadastros, Equipe...), shell com sidebar
- `components/ui/` — componentes shadcn (não editar estilo aqui sem propagar — são a fonte de verdade do design system)
- `components/features/` — componentes específicos de cada tela/domínio
- `lib/domain/` — funções puras de regra de negócio (margem, parcelas, juros) — a criar nas próximas fases
- `lib/data/` — acesso a dados com filtragem por role
- `lib/supabase/` — clients server/browser/middleware
- `supabase/migrations/` — SQL rodado manualmente no SQL Editor do Supabase (sem CLI conectada)
- `e2e/` — testes Playwright, com helpers de admin API em `e2e/helpers/admin.ts`

## 4. Documentação

Toda documentação fica no vault: `Revenda360SecondBrain/`
Logs de sessão: `Revenda360SecondBrain/devtrack/`
Formato dos logs: `YYYY-MM-DD - Título.md`

## 5. Regras de desenvolvimento

- **Pode commitar sem pedir permissão a cada vez** — inclusive ao terminar uma fase inteira — desde que passe antes pela verificação obrigatória (typecheck + lint + build) e pelos testes automáticos (unitários + E2E). Regra atualizada em 2026-08-05; substitui qualquer versão anterior que exigisse permissão explícita.
- **Nunca incluir "Co-Authored-By: Claude" ou assinatura similar nos commits.**
- **Toda tela nova construída (Fase 1 em diante) deve nascer com teste E2E Playwright**, seguindo o padrão de `e2e/fase0.spec.ts` (helpers de admin API para preparar dados, sem depender de e-mail real quando possível).
- Design system: qualquer ajuste visual (cor, altura de campo, tipografia) deve ser feito nos componentes compartilhados (`components/ui/*`, `app/globals.css`), nunca só numa tela — é isso que garante consistência em toda a plataforma.
- Multi-tenant: toda tabela nova precisa de `tenant_id` + RLS com a policy `current_tenant_id()`.
- Migrations do Supabase são arquivos `.sql` em `supabase/migrations/`, aplicados manualmente pelo usuário no SQL Editor (não há CLI conectada nem Docker local).
- Dados sensíveis (preço mínimo, margem, custo de aquisição) só aparecem para role `gestor` — filtrar em `lib/data/*`, nunca só no client.

## 6. Fluxo de trabalho

1. Ler memória e devtrack mais recente
2. Entender o contexto antes de implementar
3. Implementar (com teste E2E para tela nova)
4. Rodar typecheck + lint + build antes de considerar concluído
5. Atualizar devtrack ao final da sessão
