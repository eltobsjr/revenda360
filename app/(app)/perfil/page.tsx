import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getPerfilBase, getEstatisticasVendedor, getEstatisticasGestor } from "@/lib/data/perfil";
import { AvatarIniciais } from "@/components/features/perfil/avatar-iniciais";
import { EditarNomeForm } from "@/components/features/perfil/editar-nome-form";
import { TrocarSenhaCard } from "@/components/features/perfil/trocar-senha-card";
import { StatsVendedor } from "@/components/features/perfil/stats-vendedor";
import { StatsGestor } from "@/components/features/perfil/stats-gestor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  gestor: "Gestor",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
};

export default async function PerfilPage() {
  const profile = await requireProfile();
  // Erros de query propagam pro error boundary global (app/error.tsx) — não
  // duplica esse tratamento aqui.
  const perfil = await getPerfilBase(profile.id);
  if (!perfil) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Suas informações no Revenda 360.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <AvatarIniciais nome={perfil.nome} size="lg" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-semibold">{perfil.nome}</h2>
              <Badge variant="outline">{ROLE_LABEL[perfil.role] ?? perfil.role}</Badge>
              <Badge
                variant="outline"
                className={
                  perfil.ativo
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-muted-foreground/20 bg-muted text-muted-foreground"
                }
              >
                {perfil.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd>{perfil.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Revenda</dt>
                <dd>{perfil.tenant?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Loja</dt>
                <dd>{perfil.loja?.nome ?? "Sem loja vinculada"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Na plataforma desde</dt>
                <dd>{perfil.criadoEm ? new Date(perfil.criadoEm).toLocaleDateString("pt-BR") : "—"}</dd>
              </div>
            </dl>

            <EditarNomeForm nomeAtual={perfil.nome} />
          </div>
        </CardContent>
      </Card>

      {perfil.role === "vendedor" ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-semibold">Minha atividade</h2>
          <SecaoVendedor vendedorId={perfil.id} />
        </div>
      ) : null}

      {perfil.role === "gestor" ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-semibold">Minha revenda</h2>
          <SecaoGestor />
        </div>
      ) : null}

      {perfil.role === "financeiro" ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="font-medium">Nenhum dado adicional disponível</p>
            <p className="text-sm text-muted-foreground">
              Ainda não existe nenhuma informação específica do papel financeiro cadastrada no
              sistema.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <TrocarSenhaCard />
        </CardContent>
      </Card>
    </div>
  );
}

async function SecaoVendedor({ vendedorId }: { vendedorId: string }) {
  const stats = await getEstatisticasVendedor(vendedorId);
  return <StatsVendedor stats={stats} />;
}

async function SecaoGestor() {
  const stats = await getEstatisticasGestor();
  return <StatsGestor stats={stats} />;
}
