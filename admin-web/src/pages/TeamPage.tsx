import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useAddMember, useRemoveRole } from "@/api/mutations";
import { currentUserQuery, teamQuery, usersQuery } from "@/api/queries";
import { Chip } from "@/components/common/Chip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { type Column, DataTable } from "@/components/common/DataTable";
import { Spinner } from "@/components/common/Feedback";
import { TextField } from "@/components/common/Fields";
import { Icon } from "@/components/common/Icon";
import { AccountCell } from "@/components/common/UserCells";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { teamRoles } from "@/constants/team";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { countLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type AddMemberValues, addMemberSchema } from "@/schemas/forms";
import type { TeamMember, TeamRole } from "@/types/moderation";

import { ErrorPage } from "./ErrorPages";

const roles: TeamRole[] = ["admin", "moderator"];

export default function TeamPage() {
  const { data: currentUser } = useSuspenseQuery(currentUserQuery());
  // gestionar el equipo es solo para admins
  if (currentUser.role !== "admin") return <ErrorPage kind="forbidden" />;
  return <Team />;
}

function Team() {
  const team = useQuery(teamQuery());
  const addMember = useAddMember();
  const removeRole = useRemoveRole();
  // agregar y quitar roles piden confirmacion
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const members = team.data?.members ?? [];

  const columns: Column<TeamMember>[] = [
    {
      key: "member",
      header: "Miembro",
      width: 300,
      render: (member) => (
        <AccountCell name={member.isCurrentUser ? `${member.name} (tú)` : member.name} account={member} />
      ),
    },
    {
      key: "role",
      header: "Rol",
      width: 145,
      render: (member) => (
        <Chip label={teamRoles[member.role].label} variant={teamRoles[member.role].variant} />
      ),
    },
    {
      key: "grantedBy",
      header: "Otorgado por",
      width: 175,
      // sin moderador que lo otorgara, el rol viene de la configuracion inicial
      render: (member) => (
        <span className={cn("text-[15px]", member.grantedBy && "font-bold")}>
          {member.grantedBy ?? "Sistema"}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Fecha de alta",
      width: 140,
      render: (member) => <span className="text-sm text-muted-foreground">{member.joinedAt}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (member) => (
        <div className="flex flex-col items-start gap-1.5">
          <Button
            variant="destructive"
            aria-label={`Quitar rol a ${member.handle}`}
            disabled={member.isCurrentUser}
            onClick={() => setRemoving(member)}
          >
            Quitar rol
          </Button>
          {member.isCurrentUser && (
            <span className="rounded-md bg-soft px-2 py-1 text-[11px]">No puedes quitarte tu propio rol</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Page
      breadcrumb="Moderación / Equipo"
      title="Equipo"
      actions={
        <Button variant="default" onClick={() => setIsAdding(true)}>
          <Icon name="plus" />
          Agregar miembro
        </Button>
      }
      intro="Gestiona quién ayuda a mantener FriendFrame seguro."
    >
      <div className="flex h-9 items-center gap-3">
        <h2 className="text-[21px] font-bold">{countLabel(members.length, "miembro", "miembros")}</h2>
        {roles.map((role) => (
          <Chip
            key={role}
            label={countLabel(
              members.filter((member) => member.role === role).length,
              teamRoles[role].singular,
              teamRoles[role].plural,
            )}
            variant={teamRoles[role].variant}
          />
        ))}
        <span className="flex-1" />
        <Icon name="shield-check" size={18} className="text-brand" />
        <span className="text-sm text-muted-foreground">Solo Admin puede gestionar roles</span>
      </div>

      {team.isPending ? (
        <Spinner className="min-h-[200px]" />
      ) : (
        <DataTable
          label="Miembros del equipo"
          columns={columns}
          rows={members}
          getRowKey={(member) => member.id}
          rowHeight={90}
          density="comfortable"
          footer={
            <p className="flex h-[50px] items-center px-[22px] text-[13px] text-muted-foreground">
              Última actualización: {team.data?.lastUpdated}
            </p>
          }
        />
      )}

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role} className="gap-3 p-[22px]">
            <h3 className="flex items-center gap-2.5 text-xl font-bold">
              <Icon name={teamRoles[role].icon} size={20} className="text-brand" />
              {teamRoles[role].label}
            </h3>
            <p className="text-base text-muted-foreground">{teamRoles[role].scope}</p>
          </Card>
        ))}
      </div>

      {isAdding && (
        <AddMemberDialog
          members={members}
          onCancel={() => setIsAdding(false)}
          onConfirm={(userId, role, handle) => {
            setIsAdding(false);
            addMember.mutate(
              { userId, role },
              { onSuccess: () => toast.success("Miembro agregado", { description: handle }) },
            );
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          open
          tone="danger"
          icon="user-minus"
          title={`Quitar rol a ${removing.handle}`}
          confirmLabel="Quitar rol"
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            setRemoving(null);
            removeRole.mutate(removing.id, {
              onSuccess: () => toast.success("Rol quitado", { description: removing.handle }),
            });
          }}
        >
          <Chip label={teamRoles[removing.role].label} variant="accent" />
          <p className="text-center text-base text-muted-foreground">
            {removing.handle} perderá el acceso al panel. Su cuenta de FriendFrame seguirá activa.
          </p>
        </ConfirmDialog>
      )}
    </Page>
  );
}

const roleOptions: TeamRole[] = ["moderator", "admin"];

function AddMemberDialog({
  members,
  onConfirm,
  onCancel,
}: {
  members: TeamMember[];
  onConfirm: (userId: string, role: TeamRole, handle: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { query: "", role: "moderator" },
  });
  // se busca mientras se escribe, esperando a que la persona deje de teclear
  const query = useDebouncedValue(useWatch({ control: form.control, name: "query" }).trim(), 250);
  const results = useQuery({ ...usersQuery({ query }), enabled: query.length > 0 });
  // primera cuenta que coincide y que todavia no es del equipo
  const candidate =
    query.length > 0
      ? results.data?.users.find((user) => !members.some((member) => member.handle === user.handle))
      : undefined;

  return (
    <ConfirmDialog
      open
      icon="user-plus"
      title="Agregar miembro"
      confirmLabel="Agregar"
      confirmDisabled={!candidate}
      formId="add-member-form"
      onCancel={onCancel}
    >
      <form
        id="add-member-form"
        noValidate
        className="flex w-full flex-col gap-[18px]"
        onSubmit={form.handleSubmit(
          (values) => candidate && onConfirm(candidate.id, values.role, candidate.handle),
        )}
      >
        <TextField label="Buscar por nombre o @username" autoComplete="off" {...form.register("query")} />

        {candidate && (
          <p className="flex items-center gap-2.5" role="status">
            <UserAvatar initials={candidate.initials} imageUrl={candidate.avatarUrl} size={32} />
            <span className="text-base font-bold">{candidate.handle}</span>
            <Icon name="check" size={18} className="text-brand" />
          </p>
        )}

        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <RadioGroup
              aria-label="Rol"
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 gap-2.5"
            >
              {roleOptions.map((option) => (
                <label
                  key={option}
                  htmlFor={`role-${option}`}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px]",
                    option === field.value ? "border-2 border-brand bg-brand-soft" : "border border-line",
                  )}
                >
                  <RadioGroupItem id={`role-${option}`} value={option} />
                  {teamRoles[option].label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </form>
    </ConfirmDialog>
  );
}
