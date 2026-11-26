import { type ReactNode, useEffect } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";

export interface PageProps {
  breadcrumb: string;
  title: string;
  // acciones propias de la pagina; van antes del selector de tema
  actions?: ReactNode;
  // frase bajo la cabecera que explica la seccion
  intro?: ReactNode;
  children: ReactNode;
}

// cabecera y area de trabajo de cada pagina dentro de la consola
export function Page({ breadcrumb, title, actions, intro, children }: PageProps) {
  useEffect(() => {
    document.title = `${title} · FriendFrame Moderation`;
  }, [title]);

  return (
    <>
      <header className="flex h-28 items-center justify-between border-b border-line bg-surface px-8">
        <div className="flex flex-col gap-[7px]">
          <p className="text-[13px] leading-4 text-muted-foreground">{breadcrumb}</p>
          <h1 className="text-[30px] leading-9 font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <ThemeToggle variant="pill" />
        </div>
      </header>
      <main className="flex flex-col gap-5 px-8 py-6">
        {intro && <p className="text-base leading-[19px] text-muted-foreground">{intro}</p>}
        {children}
      </main>
    </>
  );
}
