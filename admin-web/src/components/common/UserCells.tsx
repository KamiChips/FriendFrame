import type { UserRef } from "@/types/moderation";

import { UserAvatar } from "./UserAvatar";

// avatar pequeno y handle, como en las filas de la cola
export function UserCell({ user }: { user: UserRef }) {
  return (
    <span className="flex items-center gap-2">
      <UserAvatar initials={user.initials} imageUrl={user.avatarUrl} size={27} />
      <span className="truncate text-sm font-bold">{user.handle}</span>
    </span>
  );
}

// avatar con nombre y handle en dos lineas, para tablas de cuentas
export function AccountCell({ name, account }: { name: string; account: UserRef }) {
  return (
    <span className="flex items-center gap-3">
      <UserAvatar initials={account.initials} imageUrl={account.avatarUrl} size={40} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[17px] leading-5">{name}</span>
        <span className="text-sm leading-[17px] font-bold">{account.handle}</span>
      </span>
    </span>
  );
}
