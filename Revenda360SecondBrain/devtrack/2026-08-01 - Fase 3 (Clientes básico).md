# 2026-08-01 — Fase 3 (Clientes básico)

Continuação da sessão de Fase 2 (ver devtrack anterior do mesmo dia).

## O que foi feito

- Migration `0004_fase3_clientes.sql`: tabela `clientes` (nome, cpf, whatsapp, email, cidade), RLS por tenant no mesmo padrão das demais tabelas, e um índice único parcial `(tenant_id, cpf) where cpf is not null` — impede CPF duplicado dentro do mesmo tenant sem impedir múltiplos clientes sem CPF cadastrado ainda. Aplicada pelo usuário no SQL Editor.
- `lib/validation/cliente.schema.ts`: schema zod básico (nome obrigatório, demais campos opcionais).
- `lib/data/clientes.ts`: `listClientes(busca?)`, com busca por nome OU CPF usando `.ilike` + `.or()` do PostgREST. Termo de busca é sanitizado (remove `,`, `(`, `)`) antes de entrar na string do filtro — esses caracteres têm significado especial na sintaxe de `.or()` do PostgREST e um valor de busca com vírgula/parênteses poderia montar uma condição de filtro diferente da pretendida.
- Tela `/clientes`: lista simples (Server Component) + form de busca via querystring (mesmo padrão do Estoque) + modal de cadastro rápido (`ClienteQuickCreate`, Client Component com `Dialog` do shadcn + `useActionState`).
- Server Action `criarCliente` em `app/(app)/clientes/actions.ts`, seguindo o mesmo padrão de `criarMembroEquipe` (form action simples com FormData, não o padrão JSON/transition do wizard de veículo).

### Dois bugs encontrados e corrigidos durante o QA com Playwright

1. **`formData.get()` retorna `null` para campo ausente do form, não `""`** — o modal de cadastro rápido não tem campo de e-mail, então `formData.get("email")` vinha `null`. Passado direto pro zod (`email: formData.get("email")`), isso quebrava a validação: `z.string().optional()` aceita `undefined` mas não `null` como valor do tipo base. Corrigido convertendo todo campo com `String(formData.get(campo) ?? "")` antes de validar.

2. **Efeito colateral do fechamento automático do modal ao reabrir** (mais sutil): a lógica que fecha o dialog após um cadastro bem-sucedido comparava `state.sucesso` com uma flag booleana `sucessoTratado`, resetada no `onOpenChange` toda vez que o modal reabria. Como o `state` do `useActionState` só muda quando uma nova submissão termina (fica "congelado" com `sucesso: true` entre uma submissão e a próxima), resetar a flag ao reabrir fazia a condição `state.sucesso && !sucessoTratado` disparar de novo *no mesmo clique que reabria o modal*, fechando-o instantaneamente — o segundo cadastro de cada teste travava esperando um campo "Nome" que nunca aparecia. Corrigido comparando o **objeto `state` inteiro por identidade** (`state !== estadoTratado`) em vez de uma flag derivada — só reage quando o `useActionState` de fato retorna um novo objeto (nova submissão), não quando o modal é reaberto. Mesma categoria de bug que o `set-state-in-effect` já visto na Fase 2 (`midia-tab.tsx`): estado derivado de outro estado precisa ser comparado por identidade/mudança real, não por uma flag paralela fácil de dessincronizar.

### Testes E2E (`e2e/fase3-clientes.spec.ts`)

3 testes, todos via UI (sem helper de seed — o cadastro rápido é a própria interface sendo testada): cadastro pelo modal, busca por nome e por CPF (parcial, incluindo pontuação), e rejeição de CPF duplicado com a mensagem de erro correta.

Commit pendente de push nesta sessão. Suíte completa: 12/12 testes E2E passando, 16/16 vitest, typecheck/lint/build limpos.

## Decisões registradas

Nenhuma decisão de arquitetura nova — ficha completa de cliente (RG/CNH/estado civil/referências) continua planejada para fase pós-MVP, conforme o plano original.

## Pendências abertas

- Próximo passo: Fase 4 (Nova venda) — wizard de 7 etapas via RPC transacional `fechar_venda`.
- Painel administrativo do dono da plataforma continua não construído.
