import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <span className="font-heading text-base font-semibold text-primary">
          Revenda 360 — Painel do administrador
        </span>
        <div className="flex-1" />
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut />
            Sair
          </Button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
