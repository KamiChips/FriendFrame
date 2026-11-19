import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Outlet, useNavigate, useNavigation } from "react-router";

import { useSignOut } from "@/api/mutations";
import { currentUserQuery, sectionCountsQuery } from "@/api/queries";
import { Spinner } from "@/components/common/Feedback";

import { Sidebar } from "./Sidebar";

// marco de la consola: menu lateral fijo y la pagina activa a la derecha.
// el menu no se vuelve a montar al navegar entre secciones
export function AppLayout() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { data: currentUser } = useSuspenseQuery(currentUserQuery());
  const { data: sectionCounts } = useQuery(sectionCountsQuery());
  const signOut = useSignOut();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        currentUser={currentUser}
        sectionCounts={sectionCounts}
        onSignOut={() => signOut.mutate(undefined, { onSuccess: () => navigate("/", { replace: true }) })}
      />
      {/* barra fina arriba mientras carga la siguiente pagina */}
      {navigation.state === "loading" && (
        <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand" />
      )}
      <div className="min-w-0 flex-1">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
