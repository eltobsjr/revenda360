import {
  LayoutDashboard,
  Car,
  PackagePlus,
  Repeat,
  Handshake,
  ShoppingCart,
  ReceiptText,
  FileText,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  Percent,
  BarChart3,
  Contact,
  Truck,
  UsersRound,
  Tag,
  FileBarChart,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Estoque",
    items: [
      { label: "Veículos", href: "/estoque", icon: Car },
      { label: "Entrada de veículo", href: "/estoque/novo", icon: PackagePlus },
      { label: "Avaliação/Troca", href: "/estoque/avaliacao-troca", icon: Repeat },
      { label: "Consignados", href: "/estoque/consignados", icon: Handshake },
    ],
  },
  {
    label: "Vendas",
    items: [
      { label: "Nova venda", href: "/vendas/nova", icon: ShoppingCart },
      { label: "Vendas realizadas", href: "/vendas/realizadas", icon: ReceiptText },
      { label: "Propostas", href: "/vendas/propostas", icon: FileText },
      { label: "Leads (CRM)", href: "/vendas/leads", icon: Users },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Contas a receber", href: "/financeiro/receber", icon: Wallet },
      { label: "Contas a pagar", href: "/financeiro/pagar", icon: CreditCard },
      { label: "Fluxo de caixa", href: "/financeiro/fluxo-caixa", icon: TrendingUp },
      { label: "Comissões", href: "/financeiro/comissoes", icon: Percent },
      { label: "DRE por veículo", href: "/financeiro/dre", icon: BarChart3 },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { label: "Clientes", href: "/clientes", icon: Contact },
      { label: "Fornecedores", href: "/fornecedores", icon: Truck },
      { label: "Equipe", href: "/equipe", icon: UsersRound },
      { label: "Marcas/Modelos", href: "/marcas-modelos", icon: Tag },
    ],
  },
  {
    items: [
      { label: "Relatórios", href: "/relatorios", icon: FileBarChart },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];

/**
 * Atalhos de acesso rápido na barra inferior (mobile). "Perfil" mora aqui
 * (não no cabeçalho) porque o cabeçalho já é apertado em 375px — auditoria
 * de responsividade de 2026-08-10 encontrou o link de perfil no header
 * espremendo o campo de busca a ~60px de largura útil.
 */
export const MOBILE_QUICK_NAV: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Estoque", href: "/estoque", icon: Car },
  { label: "Vender", href: "/vendas/nova", icon: ShoppingCart },
  { label: "Receber", href: "/financeiro/receber", icon: Wallet },
  { label: "Perfil", href: "/perfil", icon: User },
];
