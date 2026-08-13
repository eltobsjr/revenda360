import { BrandLogo } from "@/components/brand-logo";

export function AuthSplitLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <div className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-primary px-8 py-10 text-primary-foreground md:w-[38%] md:px-12 md:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, currentColor 0, currentColor 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 40px)",
          }}
          aria-hidden
        />
        <div className="relative">
          <BrandLogo onPrimary className="block h-14" />
        </div>
        <div className="relative hidden max-w-sm flex-col gap-3 md:flex">
          <p className="font-heading text-2xl leading-tight font-medium text-balance">
            {title}
          </p>
          <p className="text-sm text-primary-foreground/75">{description}</p>
        </div>
        <p className="relative hidden text-xs text-primary-foreground/60 md:block">
          {eyebrow}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
