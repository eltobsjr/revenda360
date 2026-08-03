---
name: feedback-design-system
description: Como o design system do Revenda360 evoluiu e o que aprender disso para futuros ajustes visuais
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-01T05:02:26.500Z
---

O usuário rejeitou duas vezes o resultado visual antes de aprovar: primeiro achou os componentes customizados feitos à mão "feios" (pediu shadcn/ui explicitamente); depois, mesmo com shadcn instalado, achou que "parecia muito IA" — apontando sintomas específicos e reconhecíveis: campos/botões finos e esticados (altura 32px padrão do preset), tela de login em card centralizado genérico (o layout padrão que qualquer IA gera para auth), raio de borda uniforme sem hierarquia visual, cor de marca usada em pouquíssimos lugares, tipografia 100% default do preset sem nenhuma escolha própria.

A correção aplicada: aumentar altura de campos (h-8→h-9), substituir o card de auth por um layout dividido com painel de marca + copy específica, adicionar uma fonte de destaque (Space Grotesk) só para títulos, diferenciar o tom da sidebar do fundo do conteúdo. Tudo editado nos componentes compartilhados (`components/ui/*`, `app/globals.css`), nunca em telas isoladas.

**Why:** O usuário é sensível a "cheiro de IA" em UI gerada — layouts genéricos de templates (card centralizado, densidade uniforme, cor subutilizada) são reconhecidos e rejeitados mesmo quando tecnicamente corretos. A lição maior: ao usar uma lib de componentes (shadcn ou qualquer outra), não parar no "init" — fazer 3-4 ajustes deliberados e específicos ao produto (proporção, layout de telas-chave, uso de cor, tipografia de título) é o que evita o resultado padronizado.
**How to apply:** Em qualquer novo componente ou tela deste projeto (Fases 1-6 e além), verificar antes de considerar pronto: (1) os campos têm substância proporcional ou parecem esticados? (2) a tela usa um layout específico do produto ou o template genérico mais óbvio? (3) a cor de marca aparece com intenção em mais de 1-2 lugares? (4) títulos usam a fonte de destaque (`font-heading`), não a fonte de corpo padrão? Ver decisões completas em `Revenda360SecondBrain/decisions/2026-08-01 - Rework de UI para shadcn ui.md` no repositório.
