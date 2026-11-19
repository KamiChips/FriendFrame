import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { actionFailedToast } from "@/constants/feedback";
import { type Credentials, moderation } from "@/services/moderation";
import type { Resolution, TeamRole } from "@/types/moderation";

import { keys } from "./queries";

// cualquier accion de moderacion cambia varias vistas a la vez (cola, perfil, bitacora, contadores),
// asi que al terminar se marca todo como desactualizado; solo se vuelve a pedir lo que esta en pantalla.
// si falla se avisa y no se toca nada
function useModerationMutation<Variables, Result>(mutationFn: (variables: Variables) => Promise<Result>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    onError: () => toast.error(actionFailedToast.title, { description: actionFailedToast.message }),
  });
}

export const useTakeCase = () => useModerationMutation((reportId: string) => moderation.takeCase(reportId));

export const useRevealEvidence = () =>
  useModerationMutation((reportId: string) => moderation.revealEvidence(reportId));

export const useResolveReport = () =>
  useModerationMutation(({ reportId, resolution }: { reportId: string; resolution: Resolution }) =>
    moderation.resolveReport(reportId, resolution),
  );

export const useMarkNewReportsSeen = () => useModerationMutation(() => moderation.markNewReportsSeen());

export const useRestoreAccount = () =>
  useModerationMutation(({ userId, notes }: { userId: string; notes: string }) =>
    moderation.restoreAccount(userId, notes),
  );

export const useRestoreContent = () =>
  useModerationMutation(({ userId, contentId }: { userId: string; contentId: string }) =>
    moderation.restoreContent(userId, contentId),
  );

export const useAddMember = () =>
  useModerationMutation(({ userId, role }: { userId: string; role: TeamRole }) =>
    moderation.addMember(userId, role),
  );

export const useRemoveRole = () =>
  useModerationMutation((memberId: string) => moderation.removeRole(memberId));

// iniciar o cerrar sesion cambia quien eres: se descarta todo lo guardado de la sesion anterior
export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Credentials) => moderation.signIn(credentials),
    onSuccess: () => queryClient.removeQueries({ queryKey: keys.all }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => moderation.signOut(),
    onSuccess: () => queryClient.removeQueries({ queryKey: keys.all }),
  });
}
