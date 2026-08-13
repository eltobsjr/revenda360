import Image from "next/image";

const LOGO_VARIANTS = [
  { logo: "neutro-light", src: "/logo-neutro-on-light.png", w: 502, h: 376 },
  { logo: "neutro-dark", src: "/logo-neutro.png", w: 502, h: 376 },
  { logo: "azul-light", src: "/logo-azul-on-light.png", w: 506, h: 376 },
  { logo: "azul-dark", src: "/logo-azul.png", w: 506, h: 376 },
  { logo: "verde-light", src: "/logo-verde-on-light.png", w: 501, h: 374 },
  { logo: "verde-dark", src: "/logo-verde.png", w: 501, h: 374 },
  { logo: "violeta-light", src: "/logo-violeta-on-light.png", w: 506, h: 374 },
  { logo: "violeta-dark", src: "/logo-violeta.png", w: 506, h: 374 },
] as const;

export function BrandLogo({
  className,
  onPrimary = false,
}: {
  className?: string;
  /**
   * true quando o logo fica sobre um fundo `bg-primary` sólido (ex.: painel
   * lateral de auth) em vez do fundo padrão da página — o contraste de texto
   * ideal não segue o mesmo claro/escuro do modo da página nesse caso, ver
   * regras `.brand-logo-on-primary-img` em globals.css.
   */
  onPrimary?: boolean;
}) {
  const imgClass = onPrimary ? "brand-logo-on-primary-img" : "brand-logo-img";
  return (
    <span className={className}>
      {LOGO_VARIANTS.map((v) => (
        <Image
          key={v.logo}
          data-logo={v.logo}
          src={v.src}
          alt="Revenda 360"
          width={v.w}
          height={v.h}
          priority
          className={`${imgClass} h-full w-auto object-contain`}
        />
      ))}
    </span>
  );
}
