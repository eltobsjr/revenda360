"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BRAND_THEMES,
  BRAND_STORAGE_KEY,
  DEFAULT_BRAND_THEME,
  type BrandTheme,
} from "@/lib/brand-theme";

function readInitialBrand(): BrandTheme {
  if (typeof document === "undefined") return DEFAULT_BRAND_THEME;
  const current = document.documentElement.getAttribute("data-brand");
  return (current as BrandTheme) || DEFAULT_BRAND_THEME;
}

export function BrandSwitcher() {
  const [brand, setBrand] = useState<BrandTheme>(readInitialBrand);

  function apply(next: BrandTheme) {
    setBrand(next);
    document.documentElement.setAttribute("data-brand", next);
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — tema de marca não persiste, sem problema.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Trocar tema de cor" />}
      >
        <Palette />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {BRAND_THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => apply(t.value)}
            className={brand === t.value ? "font-semibold" : undefined}
          >
            <span
              className="mr-2 size-3 rounded-full border border-border"
              style={{ background: t.swatch }}
            />
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
