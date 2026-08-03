# 2026-08-01 — Fase 2 (Entrada de veículo)

Continuação da sessão de Fase 1 (ver devtrack anterior do mesmo dia).

## O que foi feito

- Wizard de Entrada de veículo (`components/features/estoque/entrada/veiculo-form.tsx`), Client Component com abas Identificação/Documentação/Aquisição/Custos/Precificação/Mídia e anúncio/Observações. Mesmo componente atende criação (`/estoque/novo`) e edição (`/estoque/[id]/editar`), diferenciando pelo `veiculoId` opcional.
- `lib/validation/veiculo.schema.ts` ganhou o schema completo do formulário (`veiculoFormSchema`/`VeiculoFormInput`), cobrindo todos os campos de `veiculos` em camelCase, mais `custoLinhaSchema` e a lista `PORTAIS_DISPONIVEIS`.
- Server Actions em `app/(app)/estoque/actions.ts`: `salvarVeiculo` (insert ou update + reinsert completo de `custos_veiculo`), `salvarFotoVeiculo`, `removerFotoVeiculo`, `criarUrlAssinadaFoto` (signed URL de 1h para exibir foto de bucket privado).
- Upload de fotos: arquivo vai direto pro Supabase Storage do client (`lib/supabase/client.ts`), só o registro (`storagePath`, ordem, capa) é gravado via Server Action. Reordenação simples e escolha de foto de capa.
- Resumo financeiro lateral (`resumo-lateral.tsx`) recalcula custo total/margem ao vivo conforme o usuário digita, usando as mesmas funções puras de `lib/domain/pricing.ts` da Fase 1.

### Bug crítico encontrado e corrigido: especificações numéricas como string

Ao submeter o formulário, `especificacoesMotoSchema`/`especificacoesCarroSchema` esperam `z.number()`, mas o estado do formulário guarda todo campo numérico como `string` (mesma semântica de input controlado). Zod v4 **não coage** string→number automaticamente, então o submit falhava sempre com "Especificações inválidas para o tipo selecionado.", mesmo com os dados corretos.

Corrigido com `especificacoesParaPayload(form)` em `form-state.ts`, que converte cada campo antes de montar o payload (incluindo o padrão `vazioParaUndefined` pra campos enum opcionais, já que `""` de um select "sem seleção" quebraria um enum zod opcional). Confirmado no navegador: cadastro de moto (Honda CG 160 Fan) e de carro (Toyota Corolla) ambos funcionando fim-a-fim, com margem calculada corretamente na tela da Ficha.

**Lição:** qualquer novo campo numérico em formulário controlado (valor como string) precisa passar por conversão explícita antes de validar com zod — não existe coação implícita aqui.

### Ajuste de acessibilidade que também virou fix de teste

O seletor "Tipo" (Carro/Moto) no topo do wizard usava um `<span>` solto ao invés de `<label htmlFor>`. Corrigido para usar `<label htmlFor="tipo-veiculo">` de verdade — sem isso, nem leitor de tela nem `getByLabel()` do Playwright conseguiam associar o texto ao select.

### Testes E2E (`e2e/fase2-entrada-veiculo.spec.ts`)

3 testes: gestor cadastra uma moto (campos específicos: cilindrada, tipo), gestor cadastra um carro (campos específicos: câmbio, carroceria), gestor edita um veículo existente e vê a mudança refletida na Ficha. Detalhe de Playwright: `getByLabel("Placa")` e `getByLabel("Modelo")` sem `{ exact: true }` davam "strict mode violation" porque batem por substring — "Placa" casava com "Município de **em-placa**mento" e "Modelo" com "Ano do **modelo**". O botão "Editar" da Ficha é `role="button"` (não `"link"`) porque o `Button` do shadcn com `nativeButton={false}` renderiza como `<a>` mas expõe role ARIA de button.

Commit `4c0f987`, pushado. Suíte completa: 9/9 testes E2E passando, 16/16 vitest, typecheck/lint/build limpos.

## Decisões registradas

Nenhuma decisão de arquitetura nova nesta fase — só implementação conforme o plano já aprovado.

## Pendências abertas

- Próximo passo: Fase 3 (Clientes básico) — lista simples + modal de cadastro rápido (nome, CPF, whatsapp, cidade) + busca por CPF/nome.
- Painel administrativo do dono da plataforma continua não construído.
