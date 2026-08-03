# Rework de UI para shadcn/ui — 2026-08-01

## Contexto

A Fase 0 foi construída inicialmente com componentes de UI feitos à mão (Button/Input/Card customizados, tokens OKLCH portados manualmente do protótipo). O usuário achou o resultado feio e pediu para refazer usando https://ui.shadcn.com/.

## Alternativas consideradas

- **Manter a paleta original do protótipo** (azul de marca + verde/âmbar/vermelho/azul/cinza para status) vs. **paleta nova baseada no shadcn**: o usuário escolheu paleta nova.
- **Estilo "New York" (denso) vs. "Default" (espaçoso)** do shadcn: escolhido New York — combina com ferramenta operacional de gestão (o próprio prompt de design original pedia densidade alta, "usuário vem do Excel e quer ver tudo").
- **Cor de destaque única vs. múltiplos temas**: o usuário pediu "faz vários temas" — implementado como 4 presets de marca trocáveis em runtime (Azul/Verde/Violeta/Neutro) via atributo `data-brand` no `<html>`, independentes das cores semânticas de status (sucesso/aviso/info/destructive), que são fixas e não mudam com o tema de marca.

## Segunda rodada — "parece muito IA"

Depois do primeiro rework, o usuário apontou que o resultado ainda "parecia muito IA" — sintomas específicos: inputs/botões finos e esticados (32px), tela de login em card centralizado genérico (o layout nº1 que qualquer IA gera para auth), raio de borda uniforme sem hierarquia, cor de marca usada em só 1-2 lugares, tipografia 100% padrão do preset.

## Decisão

1. Aumentar a altura de Input/Button/NativeSelect de `h-8` para `h-9` (e variantes `lg`/`icon` proporcionalmente) — editado direto em `components/ui/*`, não por tela, para propagar automaticamente.
2. Substituir o card centralizado de login/cadastro/onboarding por um layout dividido (`components/auth-split-layout.tsx`): painel de marca sólida à esquerda com padrão de grade sutil + copy específica da tela, formulário à direita sem caixa.
3. Adicionar Space Grotesk como fonte de destaque para títulos (`--font-heading`), mantendo Geist no corpo/tabelas.
4. Diferenciar o tom da sidebar (`--sidebar`) do fundo do conteúdo, que antes eram quase idênticos.

## Consequências

- Qualquer ajuste de design deve ser feito nos componentes compartilhados (`components/ui/*`, `app/globals.css`, `components/auth-split-layout.tsx`), nunca só numa tela — é assim que a consistência se propaga automaticamente para as fases futuras (Estoque, Vendas, etc.), que ainda vão nascer usando esses mesmos componentes.
- Verificado por auditoria de grep (sem `h-8` hardcoded fora de `components/ui/`, sem heading sem `font-heading`) + inspeção visual das telas Equipe e Estoque (stub) — confirmando que a mudança realmente propagou.

## Referências

- [[Revenda360 — Visão Geral]]
- Componentes shadcn instalados via `npx shadcn@latest add` (preset "nova", base Base UI — não Radix)
