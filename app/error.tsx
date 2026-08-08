"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <h1 className="font-heading text-lg font-semibold">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">
          Um erro inesperado aconteceu. Tente novamente — se persistir, avise o suporte.
        </p>
      </div>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </div>
  );
}
