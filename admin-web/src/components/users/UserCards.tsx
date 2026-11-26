import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";

import { Chip, type ChipVariant } from "@/components/common/Chip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { type Column, DataTable } from "@/components/common/DataTable";
import { NotesField } from "@/components/common/Fields";
import { Icon } from "@/components/common/Icon";
import { AccountCell } from "@/components/common/UserCells";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contentTypes } from "@/constants/content-types";
import { timelineIcons } from "@/constants/sanctions";
import { type RestoreAccountValues, restoreAccountSchema } from "@/schemas/forms";
import type {
  AccountStatus,
  HiddenContent,
  ProfileCounter,
  TimelineEvent,
  UserAccount,
  UserProfile,
} from "@/types/moderation";

const statuses: Record<AccountStatus, { label: string; variant: ChipVariant }> = {
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "notice" },
  banned: { label: "Banned", variant: "danger" },
};

// fin de la suspension, como "15 nov", se agrega a la etiqueta
export function AccountStatusChip({ status, until }: { status: AccountStatus; until?: string }) {
  const { label, variant } = statuses[status];
  return <Chip label={until ? `${label} until ${until}` : label} variant={variant} />;
}

const userColumns: Column<UserAccount>[] = [
  {
    key: "account",
    header: "Account",
    width: 370,
    render: (user) => <AccountCell name={user.name} account={user} />,
  },
  {
    key: "status",
    header: "Status",
    width: 180,
    render: (user) => <AccountStatusChip status={user.status} />,
  },
  {
    key: "reports",
    header: "Reports received",
    width: 150,
    render: (user) => <span className="text-[17px] font-bold">{user.reportsReceived}</span>,
  },
  {
    key: "activity",
    header: "Last activity",
    render: (user) => <span className="text-sm text-muted-foreground">{user.lastActivity}</span>,
  },
  {
    key: "actions",
    header: "Actions",
    width: 110,
    render: (user) => (
      <Link
        to={`/users/${user.id}`}
        aria-label={`View ${user.handle}'s profile`}
        className="text-sm text-link hover:underline"
      >
        View profile ↗
      </Link>
    ),
  },
];

export function UsersTable({ users }: { users: UserAccount[] }) {
  return (
    <DataTable
      label="Accounts found"
      columns={userColumns}
      rows={users}
      getRowKey={(user) => user.id}
      rowHeight={68}
      density="comfortable"
      footer={
        <p className="flex h-[50px] items-center px-[22px] text-[13px] text-muted-foreground">
          No sensitive personal data is shown.
        </p>
      }
    />
  );
}

// quien es la cuenta y, si esta sancionada, por que
export function ProfileIdentityCard({ profile }: { profile: UserProfile }) {
  const sanction = profile.activeSanction;

  return (
    <Card className="flex-row items-center gap-[22px] p-6">
      <UserAvatar initials={profile.initials} imageUrl={profile.avatarUrl} size={82} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="text-[27px] leading-8 font-bold">{profile.name}</h2>
        <p className="text-lg font-bold">{profile.handle}</p>
        <p className="text-sm text-muted-foreground">Member since {profile.memberSince}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <AccountStatusChip status={profile.status} until={sanction?.until} />
        {sanction && (
          <>
            <p className="text-[13px] text-muted-foreground">
              Applied by {sanction.appliedBy} · {sanction.appliedAt}
            </p>
            <Link to={`/reports/${sanction.reportId}`} className="text-[13px] text-link hover:underline">
              Report {sanction.reportCode} ↗
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}

export function CounterCard({ counter }: { counter: ProfileCounter }) {
  return (
    <Card className="min-w-0 flex-1 gap-1.5 p-[18px]">
      <div className="flex items-center gap-3.5">
        <span className="text-[32px] leading-[38px] font-bold">{counter.value}</span>
        <span className="text-lg">{counter.label}</span>
      </div>
      <p className="text-[13px] text-muted-foreground">{counter.caption}</p>
    </Card>
  );
}

export type ProfileTab = "timeline" | "hidden";

function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-soft">
        <Icon name={timelineIcons[event.kind]} size={17} className="text-brand" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <p className="text-base">{event.title}</p>
          <p className="text-xs text-muted-foreground">{event.date}</p>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {[event.moderator, event.reportCode, event.note].filter(Boolean).join(" · ")}
        </p>
      </div>
    </li>
  );
}

// contenido oculto de la cuenta con su contexto y la opcion de restaurarlo
function HiddenContentItem({
  item,
  handle,
  onRestore,
}: {
  item: HiddenContent;
  handle: string;
  onRestore: () => void;
}) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="h-[78px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-soft">
        {item.mediaUrl && <img src={item.mediaUrl} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-lg font-bold">
          {contentTypes[item.contentType].label} · {item.reportCode}
        </p>
        <p className="text-[15px]">Posted by {handle}</p>
        <p className="text-sm text-muted-foreground">On {item.profileOwnerHandle}'s profile</p>
        <p className="text-[13px] text-muted-foreground">Hidden · {item.hiddenAt}</p>
      </div>
      <Button
        onClick={onRestore}
        aria-label={`Restore ${contentTypes[item.contentType].label} ${item.reportCode}`}
      >
        Restore
      </Button>
    </li>
  );
}

// pestanas del perfil: eventos de moderacion y contenido oculto
export function ProfileActivityCard({
  activeTab,
  profile,
  onChangeTab,
  onRestoreContent,
}: {
  activeTab: ProfileTab;
  profile: UserProfile;
  onChangeTab: (tab: ProfileTab) => void;
  onRestoreContent: (contentId: string) => void;
}) {
  const trigger =
    "text-muted-foreground data-[state=active]:text-on-brand-soft data-[state=active]:border-brand h-auto flex-none rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-0 pb-3 text-lg shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent";

  return (
    <Card className="gap-[18px] p-[22px]">
      <Tabs value={activeTab} onValueChange={(value) => onChangeTab(value as ProfileTab)}>
        <TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b border-line bg-transparent p-0">
          <TabsTrigger value="timeline" className={trigger}>
            Timeline
          </TabsTrigger>
          <TabsTrigger value="hidden" className={trigger}>
            Hidden content ({profile.hiddenContent.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="pt-[18px]">
          <ul className="flex flex-col gap-[18px]">
            {profile.timeline.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </ul>
          {profile.timeline.length === 0 && (
            <p className="text-sm text-muted-foreground">This account has no moderation events.</p>
          )}
        </TabsContent>
        <TabsContent value="hidden" className="pt-[6px]">
          {profile.hiddenContent.length > 0 ? (
            <ul>
              {profile.hiddenContent.map((item) => (
                <HiddenContentItem
                  key={item.id}
                  item={item}
                  handle={profile.handle}
                  onRestore={() => onRestoreContent(item.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="pt-3 text-sm text-muted-foreground">This account has no hidden content.</p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// recordatorio de lo que implica restaurar una cuenta sancionada
export function RestoreGuidanceCard({ handle }: { handle: string }) {
  return (
    <Card className="gap-4 p-[22px]">
      <Icon name="info" size={24} className="text-brand" />
      <h2 className="text-xl font-bold">Before restoring</h2>
      <p className="text-[15px] leading-[18px] text-muted-foreground">
        The account will regain access to FriendFrame. Evidence and moderation history will be kept.
      </p>
      <div className="h-px bg-line" />
      <p className="text-sm">Write a reason in the internal notes to leave context for the team.</p>
      <Link to="/reports?status=all" className="self-start text-sm text-link hover:underline">
        View reports for {handle} ↗
      </Link>
    </Card>
  );
}

// restaurar exige un motivo para dejar contexto al equipo
export function RestoreAccountDialog({
  handle,
  onConfirm,
  onCancel,
}: {
  handle: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<RestoreAccountValues>({
    resolver: zodResolver(restoreAccountSchema),
    mode: "onChange",
    defaultValues: { notes: "" },
  });
  const notes = useWatch({ control: form.control, name: "notes" });

  return (
    <ConfirmDialog
      open
      icon="rotate-ccw"
      title={`Restore ${handle}`}
      description="The account will regain access. We'll keep its history."
      confirmLabel="Restore"
      confirmDisabled={!form.formState.isValid}
      formId="restore-form"
      onCancel={onCancel}
    >
      <form
        id="restore-form"
        noValidate
        className="w-full"
        onSubmit={form.handleSubmit((values) => onConfirm(values.notes))}
      >
        <NotesField length={notes.length} required {...form.register("notes")} />
      </form>
    </ConfirmDialog>
  );
}
