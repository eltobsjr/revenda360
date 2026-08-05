-- Bootstrap do primeiro dono da plataforma em `platform_admins`.
--
-- Não é uma migration (não vai em supabase/migrations/): é um passo manual,
-- de execução única, específico do ambiente. `platform_admins` não tem
-- policy de insert de propósito (ver 0007_admin_panel.sql) — só quem tem
-- acesso de service role (SQL Editor do Supabase) pode gerenciar essa
-- tabela diretamente.
--
-- Pré-requisito: o usuário já precisa existir em auth.users (criar antes
-- pelo Auth > Users do painel do Supabase, ou via signup, se ainda não
-- existir). Ajuste o e-mail abaixo para o e-mail de login real do dono da
-- plataforma antes de rodar.

insert into public.platform_admins (user_id)
select id
from auth.users
where email = 'eltobsjr@gmail.com' -- TODO: confirmar se é este o e-mail de login usado
on conflict (user_id) do nothing;

-- Conferência: deve retornar 1 linha com o e-mail acima.
select pa.user_id, u.email, pa.criado_em
from public.platform_admins pa
join auth.users u on u.id = pa.user_id;
