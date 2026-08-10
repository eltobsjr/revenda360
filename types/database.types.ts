// Tipos escritos à mão para o schema atual (Fase 0). Quando o usuário conectar
// a Supabase CLI no futuro, isto pode ser substituído por
// `supabase gen types typescript` sem mudar a forma como é consumido
// (Database["public"]["Tables"][...]). O formato (Row/Insert/Update/
// Relationships, Views, Functions) segue o que @supabase/postgrest-js exige
// para inferência de tipos funcionar (GenericSchema).

export type UserRole = "gestor" | "vendedor" | "financeiro";

export type TipoVeiculo = "carro" | "moto";

export type StatusVeiculo =
  | "Disponível"
  | "Em preparação"
  | "Reservado"
  | "Vendido"
  | "Consignado"
  | "Repasse"
  | "Devolvido";

export type StatusVenda = "confirmada" | "cancelada";

export type TipoPagamento =
  | "dinheiro"
  | "pix"
  | "cartao"
  | "transferencia"
  | "troca"
  | "financiamento_bancario"
  | "crediario";

export type StatusParcela = "A vencer" | "Paga" | "Atrasada" | "Parcial" | "Renegociada";

export type EtapaLead =
  | "Novo"
  | "Em contato"
  | "Visita agendada"
  | "Proposta enviada"
  | "Ganho"
  | "Perdido";

export type StatusProposta = "Em aberto" | "Aceita" | "Recusada" | "Expirada";

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
      platform_admins: {
        Row: {
          user_id: string;
          criado_em: string;
        };
        Insert: {
          user_id: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Insert"]>;
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
      veiculos: {
        Row: {
          id: string;
          tenant_id: string;
          loja_id: string | null;
          tipo: TipoVeiculo;
          placa: string;
          renavam: string | null;
          chassi: string | null;
          numero_motor: string | null;
          uf_emplacamento: string | null;
          municipio_emplacamento: string | null;
          marca: string;
          modelo: string;
          versao: string | null;
          ano_fab: number | null;
          ano_mod: number | null;
          cor: string | null;
          combustivel: string | null;
          km: number;
          procedencia: string;
          categoria: string;
          proprietarios_anteriores: number;
          crlv_em_dia: boolean;
          ipva_status: string;
          ipva_valor: number | null;
          ipva_ano: number | null;
          licenciamento_em_dia: boolean;
          multas_valor: number;
          gravame: boolean;
          gravame_financeira: string | null;
          gravame_valor_quitacao: number | null;
          crv_em_maos: boolean;
          atpve: boolean;
          laudo_cautelar: string;
          historico_leilao_sinistro: boolean;
          chave_reserva: boolean;
          manual_proprietario: boolean;
          data_entrada: string;
          origem: string;
          fornecedor: string | null;
          valor_compra: number;
          forma_pag_compra: string | null;
          valor_fipe: number | null;
          preco_venda: number;
          preco_financiamento: number | null;
          preco_minimo: number | null;
          descricao_anuncio: string | null;
          portais_publicar: string[];
          especificacoes: Record<string, unknown>;
          status: StatusVeiculo;
          observacoes: string | null;
          origem_troca_pagamento_id: string | null;
          fornecedor_id: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          loja_id?: string | null;
          tipo: TipoVeiculo;
          placa: string;
          renavam?: string | null;
          chassi?: string | null;
          numero_motor?: string | null;
          uf_emplacamento?: string | null;
          municipio_emplacamento?: string | null;
          marca: string;
          modelo: string;
          versao?: string | null;
          ano_fab?: number | null;
          ano_mod?: number | null;
          cor?: string | null;
          combustivel?: string | null;
          km?: number;
          procedencia?: string;
          categoria?: string;
          proprietarios_anteriores?: number;
          crlv_em_dia?: boolean;
          ipva_status?: string;
          ipva_valor?: number | null;
          ipva_ano?: number | null;
          licenciamento_em_dia?: boolean;
          multas_valor?: number;
          gravame?: boolean;
          gravame_financeira?: string | null;
          gravame_valor_quitacao?: number | null;
          crv_em_maos?: boolean;
          atpve?: boolean;
          laudo_cautelar?: string;
          historico_leilao_sinistro?: boolean;
          chave_reserva?: boolean;
          manual_proprietario?: boolean;
          data_entrada?: string;
          origem?: string;
          fornecedor?: string | null;
          valor_compra?: number;
          forma_pag_compra?: string | null;
          valor_fipe?: number | null;
          preco_venda?: number;
          preco_financiamento?: number | null;
          preco_minimo?: number | null;
          descricao_anuncio?: string | null;
          portais_publicar?: string[];
          especificacoes?: Record<string, unknown>;
          status?: StatusVeiculo;
          observacoes?: string | null;
          origem_troca_pagamento_id?: string | null;
          fornecedor_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["veiculos"]["Insert"]>;
        Relationships: [];
      };
      custos_veiculo: {
        Row: {
          id: string;
          tenant_id: string;
          veiculo_id: string;
          categoria: string;
          descricao: string | null;
          fornecedor: string | null;
          valor: number;
          data: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          veiculo_id: string;
          categoria: string;
          descricao?: string | null;
          fornecedor?: string | null;
          valor: number;
          data?: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["custos_veiculo"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "custos_veiculo_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
        ];
      };
      veiculo_fotos: {
        Row: {
          id: string;
          tenant_id: string;
          veiculo_id: string;
          storage_path: string;
          ordem: number;
          capa: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          veiculo_id: string;
          storage_path: string;
          ordem?: number;
          capa?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["veiculo_fotos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "veiculo_fotos_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          cpf: string | null;
          whatsapp: string | null;
          email: string | null;
          cidade: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          cpf?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          cidade?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [];
      };
      vendas: {
        Row: {
          id: string;
          tenant_id: string;
          veiculo_id: string;
          cliente_id: string | null;
          cliente_nome_avulso: string | null;
          vendedor_id: string;
          data_venda: string;
          valor_venda: number;
          desconto: number;
          valor_final: number;
          comissao_pct: number;
          comissao_valor: number;
          garantia: string | null;
          observacoes: string | null;
          status: StatusVenda;
          comissao_paga: boolean;
          comissao_data_pagamento: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          veiculo_id: string;
          cliente_id?: string | null;
          cliente_nome_avulso?: string | null;
          vendedor_id: string;
          data_venda?: string;
          valor_venda: number;
          desconto?: number;
          valor_final: number;
          comissao_pct?: number;
          comissao_valor?: number;
          garantia?: string | null;
          observacoes?: string | null;
          status?: StatusVenda;
          comissao_paga?: boolean;
          comissao_data_pagamento?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendas_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      venda_pagamentos: {
        Row: {
          id: string;
          tenant_id: string;
          venda_id: string;
          tipo: TipoPagamento;
          valor: number;
          detalhes: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venda_id: string;
          tipo: TipoPagamento;
          valor: number;
          detalhes?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["venda_pagamentos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "venda_pagamentos_venda_id_fkey";
            columns: ["venda_id"];
            isOneToOne: false;
            referencedRelation: "vendas";
            referencedColumns: ["id"];
          },
        ];
      };
      contratos_crediario: {
        Row: {
          id: string;
          tenant_id: string;
          venda_id: string;
          cliente_id: string | null;
          veiculo_id: string;
          valor_total: number;
          taxa_juros_mensal: number;
          qtd_parcelas: number;
          data_primeiro_vencimento: string;
          status: string;
          contrato_anterior_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venda_id: string;
          cliente_id?: string | null;
          veiculo_id: string;
          valor_total: number;
          taxa_juros_mensal?: number;
          qtd_parcelas: number;
          data_primeiro_vencimento: string;
          status?: string;
          contrato_anterior_id?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contratos_crediario"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contratos_crediario_venda_id_fkey";
            columns: ["venda_id"];
            isOneToOne: false;
            referencedRelation: "vendas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contratos_crediario_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contratos_crediario_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
        ];
      };
      parcelas: {
        Row: {
          id: string;
          tenant_id: string;
          contrato_id: string;
          numero: number;
          vencimento: string;
          valor: number;
          valor_pago: number;
          status: StatusParcela;
          data_pagamento: string | null;
          desconto_aplicado: number;
          juros_multa_aplicado: number;
          forma_pagamento: TipoPagamento | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          contrato_id: string;
          numero: number;
          vencimento: string;
          valor: number;
          valor_pago?: number;
          status?: StatusParcela;
          data_pagamento?: string | null;
          desconto_aplicado?: number;
          juros_multa_aplicado?: number;
          forma_pagamento?: TipoPagamento | null;
        };
        Update: Partial<Database["public"]["Tables"]["parcelas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "parcelas_contrato_id_fkey";
            columns: ["contrato_id"];
            isOneToOne: false;
            referencedRelation: "contratos_crediario";
            referencedColumns: ["id"];
          },
        ];
      };
      contas_pagar: {
        Row: {
          id: string;
          tenant_id: string;
          descricao: string;
          categoria: string | null;
          fornecedor: string | null;
          valor: number;
          vencimento: string;
          status: StatusParcela;
          valor_pago: number;
          data_pagamento: string | null;
          forma_pagamento: TipoPagamento | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          descricao: string;
          categoria?: string | null;
          fornecedor?: string | null;
          valor: number;
          vencimento: string;
          status?: StatusParcela;
          valor_pago?: number;
          data_pagamento?: string | null;
          forma_pagamento?: TipoPagamento | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contas_pagar"]["Insert"]>;
        Relationships: [];
      };
      consignacoes: {
        Row: {
          id: string;
          tenant_id: string;
          veiculo_id: string;
          consignante_nome: string;
          consignante_contato: string | null;
          valor_repasse: number;
          contas_pagar_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          veiculo_id: string;
          consignante_nome: string;
          consignante_contato?: string | null;
          valor_repasse: number;
          contas_pagar_id?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consignacoes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "consignacoes_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: true;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consignacoes_contas_pagar_id_fkey";
            columns: ["contas_pagar_id"];
            isOneToOne: false;
            referencedRelation: "contas_pagar";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedores: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          contato: string | null;
          cnpj_cpf: string | null;
          observacoes: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          contato?: string | null;
          cnpj_cpf?: string | null;
          observacoes?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fornecedores"]["Insert"]>;
        Relationships: [];
      };
      marcas: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marcas"]["Insert"]>;
        Relationships: [];
      };
      modelos: {
        Row: {
          id: string;
          tenant_id: string;
          marca_id: string;
          nome: string;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          marca_id: string;
          nome: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["modelos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "modelos_marca_id_fkey";
            columns: ["marca_id"];
            isOneToOne: false;
            referencedRelation: "marcas";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          contato: string | null;
          origem: string | null;
          veiculo_interesse_id: string | null;
          vendedor_id: string | null;
          etapa: EtapaLead;
          observacoes: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          contato?: string | null;
          origem?: string | null;
          veiculo_interesse_id?: string | null;
          vendedor_id?: string | null;
          etapa?: EtapaLead;
          observacoes?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leads_veiculo_interesse_id_fkey";
            columns: ["veiculo_interesse_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_vendedor_id_fkey";
            columns: ["vendedor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      propostas: {
        Row: {
          id: string;
          tenant_id: string;
          veiculo_id: string;
          cliente_id: string | null;
          cliente_nome_avulso: string | null;
          valor_proposto: number;
          condicoes: string | null;
          status: StatusProposta;
          validade: string | null;
          vendedor_id: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          veiculo_id: string;
          cliente_id?: string | null;
          cliente_nome_avulso?: string | null;
          valor_proposto: number;
          condicoes?: string | null;
          status?: StatusProposta;
          validade?: string | null;
          vendedor_id: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["propostas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "propostas_veiculo_id_fkey";
            columns: ["veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propostas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      provisionar_revenda: {
        Args: {
          p_user_id: string;
          p_nome_revenda: string;
          p_nome_usuario: string;
          p_loja_nome: string;
          p_loja_cidade?: string | null;
          p_loja_uf?: string | null;
        };
        Returns: string;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      excluir_revenda: {
        Args: {
          p_tenant_id: string;
        };
        Returns: undefined;
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
      fechar_venda: {
        Args: {
          payload: Record<string, unknown>;
        };
        Returns: string;
      };
      renegociar_contrato: {
        Args: {
          payload: Record<string, unknown>;
        };
        Returns: string;
      };
    };
  };
};
