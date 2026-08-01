import { Card, CardContent } from "@/components/ui/card";

export function StubScreen({
  title,
  fase,
}: {
  title: string;
  fase: string;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-sm border-dashed">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Esta tela existe e é navegável, mas ainda será construída em {fase}{" "}
            — ver plano de fases do Revenda 360.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
