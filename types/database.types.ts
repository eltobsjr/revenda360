// Tipos escritos à mão para o schema atual (Fase 0). Quando o usuário conectar
// a Supabase CLI no futuro, isto pode ser substituído por
// `supabase gen types typescript` sem mudar a forma como é consumido
// (Database["public"]["Tables"][...]). O formato (Row/Insert/Update/
// Relationships, Views, Functions) segue o que @supabase/postgrest-js exige
// para inferência de tipos funcionar (GenericSchema).

export type UserRole = "gestor" | "vendedor" | "financeiro";

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          plano: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj?: string | null;
          plano?: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      tenant_config: {
        Row: {
          tenant_id: string;
          multa_pct: number;
          mora_pct_dia: number;
          margem_minima_pct_default: number;
          dias_alerta_estoque_parado: number;
        };
        Insert: {
          tenant_id: string;
          multa_pct?: number;
          mora_pct_dia?: number;
          margem_minima_pct_default?: number;
          dias_alerta_estoque_parado?: number;
        };
        Update: Partial<Database["public"]["Tables"]["tenant_config"]["Insert"]>;
        Relationships: [];
      };
      lojas: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          endereco: string | null;
          cidade: string | null;
          uf: string | null;
          telefone: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          endereco?: string | null;
          cidade?: string | null;
          uf?: string | null;
          telefone?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lojas"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          loja_id: string | null;
          nome: string;
          role: UserRole;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          loja_id?: string | null;
          nome: string;
          role?: UserRole;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      onboarding_criar_tenant: {
        Args: {
          p_nome_revenda: string;
          p_nome_usuario: string;
          p_loja_nome: string;
          p_loja_cidade?: string | null;
          p_loja_uf?: string | null;
        };
        Returns: string;
      };
      criar_membro_equipe: {
        Args: {
          p_user_id: string;
          p_nome: string;
          p_role: UserRole;
          p_loja_id?: string | null;
        };
        Returns: undefined;
      };
      current_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
  };
};
