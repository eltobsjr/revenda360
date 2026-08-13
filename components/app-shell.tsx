"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandSwitcher } from "@/components/brand-switcher";
import { BrandLogo } from "@/components/brand-logo";
import { AvatarIniciais } from "@/components/features/perfil/avatar-iniciais";
import { NAV, MOBILE_QUICK_NAV } from "@/lib/nav";
import { logout } from "@/app/(auth)/actions";

const ROLE_LABEL: Record<string, string> = {
  gestor: "Gestor",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
};

export function AppShell({
  nome,
  role,
  children,
}: {
  nome: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 overflow-hidden px-2 py-2">
            <BrandLogo className="h-10 shrink-0 group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {NAV.map((group, i) => (
            <SidebarGroup key={group.label ?? i}>
              {group.label ? (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={active}
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />

          <div className="flex flex-1 items-center">
            <Input
              id="r360-search"
              type="search"
              placeholder="Buscar por placa, modelo, cliente ou CPF…"
              className="max-w-md"
            />
          </div>

          <BrandSwitcher />
          <ThemeToggle />

          <Link
            href="/perfil"
            className="hidden items-center gap-2 rounded-md p-1 sm:flex hover:bg-muted"
          >
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{nome}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABEL[role] ?? role}
              </p>
            </div>
            <AvatarIniciais nome={nome} size="sm" />
          </Link>

          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut />
              Sair
            </Button>
          </form>
        </header>

        <main className="flex-1 pb-16 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 border-t bg-sidebar md:hidden">
          {MOBILE_QUICK_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
