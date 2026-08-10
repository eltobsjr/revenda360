import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { buttonVariants } from "@/components/ui/button";

/**
 * Interstitial entre o link enviado (WhatsApp etc.) e `/auth/confirm`, que
 * de fato consome o token de recovery de uso único — ver `gerarLinkDefinirSenha`
 * pra o porquê: apps de mensagens buscam a URL sozinhos pra gerar prévia, e
 * essa página não toca no Supabase, só repassa os parâmetros no clique.
 */
export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;

  if (!token_hash || !type) {
    return (
      <AuthSplitLayout
        eyebrow="Link inválido"
        title="Esse link não é válido."
        description="Peça um novo link pra quem administra sua revenda."
      >
        <h1 className="font-heading mb-2 text-2xl font-semibold">Link inválido</h1>
        <p className="text-sm text-muted-foreground">
          Faltam informações nesse link. Peça um novo pra quem administra sua revenda.
        </p>
      </AuthSplitLayout>
    );
  }

  const params = new URLSearchParams({ token_hash, type });
  if (next) params.set("next", next);

  return (
    <AuthSplitLayout
      eyebrow="Um clique a mais, por segurança"
      title="Confirme para continuar."
      description="Só validamos o link depois que você clica — isso evita que ele seja gasto sozinho por uma prévia automática do WhatsApp ou de outro app."
    >
      <h1 className="font-heading mb-6 text-2xl font-semibold">Confirmar acesso</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Clique no botão abaixo pra continuar e definir sua senha.
      </p>
      <Link href={`/auth/confirm?${params.toString()}`} className={buttonVariants({ className: "w-full" })}>
        Continuar
      </Link>
    </AuthSplitLayout>
  );
}
