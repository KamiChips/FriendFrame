import { NavLink } from "react-router";

import { BrandLogo } from "@/components/common/BrandLogo";
import { Chip } from "@/components/common/Chip";
import { Icon } from "@/components/common/Icon";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { type SectionKey, sections } from "@/constants/navigation";
import { teamRoles } from "@/constants/team";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/types/moderation";

export interface SidebarProps {
  currentUser: CurrentUser;
  // recuentos opcionales por seccion, como los reportes abiertos
  sectionCounts?: Partial<Record<SectionKey, number>>;
  onSignOut: () => void;
}

export function Sidebar({ currentUser, sectionCounts = {}, onSignOut }: SidebarProps) {
  // las secciones de administracion no se ofrecen a moderadores
  const visible = sections.filter((section) => !section.adminOnly || currentUser.role === "admin");
  const role = teamRoles[currentUser.role];

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-5 border-r border-line bg-surface px-5 pt-[30px] pb-6">
      <div className="flex flex-col pl-2">
        <BrandLogo size={25} />
        <span className="text-[11px] leading-[13px] text-muted-foreground">CONSOLE / MODERATION</span>
      </div>

      <nav aria-label="Sections" className="flex flex-col gap-2 pt-6">
        {visible.map((section) => {
          const count = sectionCounts[section.key];
          return (
            // NavLink marca la seccion activa tambien en subrutas: /reports/r1 activa "Reportes"
            <NavLink
              key={section.key}
              to={section.href}
              className={({ isActive }) =>
                cn(
                  // el borde izquierdo siempre ocupa su lugar para que el texto no se mueva al activarse
                  "flex h-[46px] items-center gap-3 rounded-xl border-l-4 pr-4 pl-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isActive
                    ? "rounded-l-none border-brand bg-brand/12 font-bold text-on-brand-soft hover:bg-brand/20 [&_svg]:text-on-brand-soft"
                    : // al pasar el cursor: fondo mas oscuro y texto en negritas, azul principal en claro y blanco en oscuro
                      "border-transparent text-muted-foreground hover:bg-line/60 hover:font-bold hover:text-ink dark:hover:bg-white/10 dark:hover:text-white hover:[&_svg]:text-ink dark:hover:[&_svg]:text-white",
                )
              }
            >
              <Icon name={section.icon} size={20} />
              {section.label}
              {count !== undefined && (
                <span
                  aria-label={`${count} open`}
                  className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-action px-1.5 text-xs leading-none font-bold text-on-action tabular-nums"
                >
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 rounded-xl bg-soft p-4">
        <Icon name="heart-handshake" size={24} className="text-brand" />
        <p className="text-[15px] leading-[18px]">We look after the community.</p>
        <p className="text-[13px] leading-4 text-muted-foreground">
          Every decision counts. Moderate with context and empathy.
        </p>
      </div>

      <Separator className="bg-line" />

      <div className="flex items-center gap-3">
        <UserAvatar initials={currentUser.initials} imageUrl={currentUser.avatarUrl} />
        <div className="flex flex-col gap-[3px]">
          <span className="text-base leading-[19px] font-bold">{currentUser.handle}</span>
          <Chip label={role.label} variant={role.variant} />
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="flex items-center gap-2.5 self-start pl-2 text-sm text-muted-foreground hover:text-ink"
      >
        <Icon name="log-out" size={18} className="text-current" />
        Sign out
      </button>
    </aside>
  );
}
