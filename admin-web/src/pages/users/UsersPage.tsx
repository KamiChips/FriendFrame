import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router";

import { usersQuery } from "@/api/queries";
import { Chip } from "@/components/common/Chip";
import { Spinner, StatePanel } from "@/components/common/Feedback";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Icon } from "@/components/common/Icon";
import { Page } from "@/components/layout/Page";
import { UsersTable } from "@/components/users/UserCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { accountStatusOptions, ALL, fromOption } from "@/constants/filters";
import { countLabel, formatCount } from "@/lib/format";
import { parseSearch, toSearch, type UsersSearch, usersSearchSchema } from "@/schemas/search";

const PLACEHOLDER = "Buscar por nombre o @username";

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const search = parseSearch(usersSearchSchema, params);
  const [text, setText] = useState(search.q ?? "");
  const users = useQuery({
    ...usersQuery({ query: search.q, status: search.status }),
    placeholderData: keepPreviousData,
  });

  // la busqueda y el filtro viven en la URL: se pueden compartir y sobreviven a recargar
  const update = (changes: Partial<UsersSearch>) => setParams(toSearch({ ...search, ...changes }));
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    update({ q: text.trim() || undefined });
  };

  return (
    <Page
      breadcrumb="Moderación / Usuarios"
      title="Usuarios"
      actions={users.data && <Chip label={`${formatCount(users.data.totalAccounts)} cuentas`} />}
      intro="Encuentra una cuenta y revisa su contexto antes de actuar."
    >
      <Card className="gap-3 p-[22px]">
        <h2 className="text-lg font-bold">¿A quién estás buscando?</h2>
        <form role="search" onSubmit={onSubmit} className="flex items-center gap-5">
          <label className="flex h-[50px] min-w-0 flex-1 items-center gap-3 border-b-2 border-line bg-soft px-3.5 focus-within:border-brand">
            <Icon name="search" size={20} />
            <input
              type="search"
              aria-label={PLACEHOLDER}
              placeholder={PLACEHOLDER}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
          </label>
          <FilterSelect
            label="Estado"
            width={180}
            value={search.status ?? ALL}
            options={accountStatusOptions}
            onChange={(value) => update({ status: fromOption(value) as UsersSearch["status"] })}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </Card>

      {users.isPending ? (
        <Spinner className="min-h-[200px]" />
      ) : users.isError ? (
        <StatePanel
          title="No pudimos buscar cuentas"
          description="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => void users.refetch()}
        />
      ) : (
        <>
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold">Resultados</h2>
            <p className="text-sm text-muted-foreground">
              {countLabel(users.data.users.length, "cuenta", "cuentas")} · ordenadas por actividad reciente
            </p>
          </div>
          <UsersTable users={users.data.users} />
        </>
      )}
    </Page>
  );
}
