"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyLinkField({ link, label }: { link: string; label: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        readOnly
        value={link}
        aria-label={label}
        className="font-mono text-xs"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button type="button" variant="outline" size="sm" onClick={copiar}>
        {copiado ? "Copiado!" : "Copiar"}
      </Button>
    </div>
  );
}
