"use client";

export function StopSummaryToggle({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex items-center gap-2"
      onClick={(e) => {
        // Dialogs abertos aqui dentro são portados pro <body>: o clique num botão
        // do dialog ainda borbulha por essa árvore React, mas fisicamente não está
        // mais dentro do <summary> — só bloqueia o toggle nativo quando o alvo
        // real do clique ainda está no DOM deste wrapper.
        if (e.currentTarget.contains(e.target as Node)) e.preventDefault();
      }}
    >
      {children}
    </span>
  );
}
