-- Revenda 360 — Seed de demonstração para a Fase 1 (Estoque)
-- Dados adaptados do protótipo (revenda-data.js): 13 motos + 6 carros,
-- valores e datas de entrada realistas (referência: "hoje" = 28/07/2026).
--
-- COMO USAR: troque 'NOME_DA_REVENDA_AQUI' pelo nome exato do tenant (coluna
-- `tenants.nome`) que você quer popular, e rode este arquivo no SQL Editor
-- do Supabase. Os veículos entram todos na primeira loja daquele tenant.
-- Pode rodar mais de uma vez em tenants diferentes trocando o nome.

with target as (
  select
    t.id as tenant_id,
    (select l.id from public.lojas l where l.tenant_id = t.id order by l.criado_em limit 1) as loja_id
  from public.tenants t
  where t.nome = 'NOME_DA_REVENDA_AQUI'
),
novos_veiculos as (
  insert into public.veiculos (
    tenant_id, loja_id, tipo, placa, marca, modelo, versao, ano_fab, ano_mod, cor, km,
    data_entrada, origem, valor_compra, valor_fipe, preco_venda, status, especificacoes
  )
  select target.tenant_id, target.loja_id, v.tipo, v.placa, v.marca, v.modelo, v.versao,
         v.ano_fab, v.ano_mod, v.cor, v.km, v.data_entrada::date, v.origem, v.valor_compra,
         v.valor_fipe, v.preco_venda, v.status::public.status_veiculo, v.especificacoes::jsonb
  from target, (values
    ('moto', 'PBR4E12', 'Honda',   'CG 160 Fan',       '',           2022, 2023, 'Preta',    18400, '2026-07-16', 'Compra de particular',     12800, 16200, 15990, 'Disponível',   '{"cilindradaCc":160,"tipo":"Street","acessorios":[]}'),
    ('moto', 'PBR1A93', 'Honda',   'Biz 125',           'EX',         2021, 2021, 'Vermelha', 24100, '2026-06-17', 'Troca',                    8900,  11700, 11490, 'Disponível',   '{"cilindradaCc":125,"tipo":"Cub/Mobilete","acessorios":[]}'),
    ('moto', 'PBR7C48', 'Yamaha',  'Factor 150',        'ED',         2020, 2020, 'Azul',     32700, '2026-05-22', 'Compra de particular',     8200,  10800, 10490, 'Disponível',   '{"cilindradaCc":150,"tipo":"Street","acessorios":[]}'),
    ('moto', 'PBR9F22', 'Honda',   'XRE 300',           'ABS',        2022, 2023, 'Vermelha', 9800,  '2026-07-23', 'Leilão',                   19500, 24300, 23990, 'Reservado',    '{"cilindradaCc":300,"tipo":"Trail/Big trail","acessorios":[]}'),
    ('moto', 'PBR2D71', 'Honda',   'PCX 160',           'DLX',        2023, 2023, 'Branca',   4200,  '2026-07-25', 'Compra de particular',     16800, 20900, 20490, 'Disponível',   '{"cilindradaCc":160,"tipo":"Scooter","acessorios":[]}'),
    ('moto', 'PBR5G60', 'Yamaha',  'Fazer 250',         'Blueflex',   2019, 2020, 'Preta',    41200, '2026-05-01', 'Repasse de outra loja',    11200, 14600, 14290, 'Disponível',   '{"cilindradaCc":250,"tipo":"Naked","acessorios":[]}'),
    ('moto', 'PBR8H35', 'Honda',   'CB 300F Twister',   'ABS',        2021, 2022, 'Cinza',    15600, '2026-07-06', 'Compra de particular',     15400, 19200, 18990, 'Vendido',      '{"cilindradaCc":300,"tipo":"Naked","acessorios":[]}'),
    ('moto', 'PBR3J84', 'Yamaha',  'NMAX 160',          'ABS',        2022, 2023, 'Azul',     11300, '2026-07-13', 'Troca',                    14200, 17800, 17490, 'Disponível',   '{"cilindradaCc":160,"tipo":"Scooter","acessorios":[]}'),
    ('moto', 'PBR6K19', 'Honda',   'Pop 110i',          '',           2020, 2021, 'Vermelha', 28900, '2026-06-24', 'Compra de particular',     6100,  8200,  7990,  'Disponível',   '{"cilindradaCc":110,"tipo":"Scooter","acessorios":[]}'),
    ('moto', 'PBR0L57', 'Suzuki',  'Intruder 125',      '',           2019, 2019, 'Preta',    37400, '2026-05-13', 'Leilão',                   7300,  9700,  9490,  'Em preparação','{"cilindradaCc":125,"tipo":"Custom","acessorios":[]}'),
    ('moto', 'PBR4M63', 'Honda',   'Bros 160',          'ESDD',       2021, 2022, 'Vermelha', 21800, '2026-07-19', 'Compra de particular',     13100, 16300, 15990, 'Disponível',   '{"cilindradaCc":160,"tipo":"Trail/Big trail","acessorios":[]}'),
    ('moto', 'PBR7N28', 'Yamaha',  'Crosser 150',       'ABS',        2020, 2021, 'Cinza',    26500, '2026-06-07', 'Consignado',               10400, 13600, 13290, 'Consignado',   '{"cilindradaCc":150,"tipo":"Trail/Big trail","acessorios":[]}'),
    ('moto', 'PBR1P95', 'Honda',   'Elite 125',         '',           2022, 2022, 'Branca',   13900, '2026-07-10', 'Troca',                    9800,  12500, 12290, 'Disponível',   '{"cilindradaCc":125,"tipo":"Scooter","acessorios":[]}'),
    ('carro','PBR2Q41', 'Chevrolet','Onix',             '1.0 LT',     2021, 2022, 'Branco',   42300, '2026-07-14', 'Compra de particular',     58000, 70200, 68900, 'Disponível',   '{"cambio":"Manual","carroceria":"Hatch","portas":4,"opcionais":[]}'),
    ('carro','PBR5R18', 'Hyundai', 'HB20',              '1.6 Comfort',2020, 2020, 'Prata',    55100, '2026-05-26', 'Troca',                    51000, 63400, 61900, 'Disponível',   '{"cambio":"Automático","carroceria":"Hatch","portas":4,"opcionais":[]}'),
    ('carro','PBR8S66', 'Fiat',    'Strada',            'Freedom 1.3',2022, 2023, 'Vermelho', 21400, '2026-07-20', 'Compra de particular',     79000, 94100, 92900, 'Reservado',    '{"cambio":"Manual","carroceria":"Picape","portas":2,"opcionais":[]}'),
    ('carro','PBR3T09', 'Toyota',  'Corolla',           'XEi 2.0',    2019, 2020, 'Preto',    68900, '2026-06-29', 'Repasse de outra loja',    92000, 111200,108900,'Disponível',   '{"cambio":"Automático","carroceria":"Sedã","portas":4,"opcionais":[]}'),
    ('carro','PBR6U77', 'Jeep',    'Compass',           'Longitude',  2021, 2021, 'Cinza',    38700, '2026-04-23', 'Compra de particular',     118000,139500,136900,'Disponível',   '{"cambio":"Automático","carroceria":"SUV","portas":4,"opcionais":[]}'),
    ('carro','PBR9V32', 'Renault', 'Kwid',              'Zen 1.0',    2022, 2022, 'Amarelo',  19200, '2026-07-07', 'Compra de particular',     45000, 55100, 53900, 'Vendido',      '{"cambio":"Manual","carroceria":"Hatch","portas":4,"opcionais":[]}')
  ) as v(tipo, placa, marca, modelo, versao, ano_fab, ano_mod, cor, km, data_entrada, origem, valor_compra, valor_fipe, preco_venda, status, especificacoes)
  returning id, placa, valor_compra, data_entrada
)
insert into public.custos_veiculo (tenant_id, veiculo_id, categoria, descricao, valor, data)
select (select tenant_id from target), nv.id, 'Mecânica', 'Preparação geral (seed de demonstração)',
       case nv.placa
         when 'PBR4E12' then 420 when 'PBR1A93' then 300 when 'PBR7C48' then 380
         when 'PBR9F22' then 250 when 'PBR2D71' then 150 when 'PBR5G60' then 610
         when 'PBR8H35' then 300 when 'PBR3J84' then 190 when 'PBR6K19' then 220
         when 'PBR0L57' then 340 when 'PBR4M63' then 280 when 'PBR7N28' then 200
         when 'PBR1P95' then 160 when 'PBR2Q41' then 1800 when 'PBR5R18' then 2200
         when 'PBR8S66' then 900 when 'PBR3T09' then 1500 when 'PBR6U77' then 1100
         when 'PBR9V32' then 600
       end,
       nv.data_entrada
from novos_veiculos nv;
