import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

import { useRestoreAccount, useRestoreContent } from "@/api/mutations";
import { userQuery } from "@/api/queries";
import { Icon } from "@/components/common/Icon";
import { Page } from "@/components/layout/Page";
import {
  CounterCard,
  ProfileActivityCard,
  ProfileIdentityCard,
  type ProfileTab,
  RestoreAccountDialog,
  RestoreGuidanceCard,
} from "@/components/users/UserCards";
import { Button } from "@/components/ui/button";
import { parseSearch, profileSearchSchema } from "@/schemas/search";
import type { UserProfile } from "@/types/moderation";

export default function UserProfilePage() {
  const { userId = "" } = useParams();
  // el loader ya comprobo que existe: aqui nunca es null
  const profile = useSuspenseQuery(userQuery(userId)).data as UserProfile;
  const [params, setParams] = useSearchParams();
  const activeTab: ProfileTab = parseSearch(profileSearchSchema, params).tab ?? "timeline";
  const setTab = (tab: ProfileTab) => setParams(tab === "timeline" ? "" : `?tab=${tab}`, { replace: true });

  const [isRestoring, setIsRestoring] = useState(false);
  const restoreAccount = useRestoreAccount();
  const restoreContent = useRestoreContent();
  // solo las cuentas suspendidas o baneadas se pueden restaurar
  const isSanctioned = profile.status !== "active";

  return (
    <Page
      breadcrumb={`Moderación / Usuarios / ${profile.handle}`}
      title={profile.handle}
      actions={
        <Button
          variant="default"
          disabled={!isSanctioned || restoreAccount.isPending}
          onClick={() => setIsRestoring(true)}
        >
          <Icon name="rotate-ccw" />
          {isSanctioned ? "Restaurar cuenta" : "Cuenta activa"}
        </Button>
      }
      intro="Perfil de moderación · contexto y actividad de la cuenta."
    >
      <ProfileIdentityCard profile={profile} />

      <div className="grid grid-cols-2 gap-4 xl:flex">
        {profile.counters.map((counter) => (
          <CounterCard key={counter.id} counter={counter} />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[740fr_368fr]">
        <ProfileActivityCard
          activeTab={activeTab}
          profile={profile}
          onChangeTab={setTab}
          onRestoreContent={(contentId) =>
            restoreContent.mutate(
              { userId: profile.id, contentId },
              { onSuccess: () => toast.success("Contenido restaurado") },
            )
          }
        />
        {isSanctioned && <RestoreGuidanceCard handle={profile.handle} />}
      </div>

      {isRestoring && (
        <RestoreAccountDialog
          handle={profile.handle}
          onCancel={() => setIsRestoring(false)}
          onConfirm={(notes) => {
            setIsRestoring(false);
            // tras restaurar se muestra la linea de tiempo con el nuevo evento
            setTab("timeline");
            restoreAccount.mutate(
              { userId: profile.id, notes },
              { onSuccess: () => toast.success("Cuenta restaurada", { description: profile.handle }) },
            );
          }}
        />
      )}
    </Page>
  );
}
