import { useQuery } from "@tanstack/react-query";
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from "react-router";

import { sectionCountsQuery } from "@/api/queries";
import { Chip } from "@/components/common/Chip";
import { ErrorMessage } from "@/components/common/Feedback";
import { Page } from "@/components/layout/Page";
import { type ErrorKind, errorPages } from "@/constants/feedback";
import { sections } from "@/constants/navigation";

// pagina de error dentro de la consola: sin permiso, inexistente o inesperado
export function ErrorPage({ kind }: { kind: ErrorKind }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: counts } = useQuery(sectionCountsQuery());
  const section = sections.find((candidate) => pathname.startsWith(candidate.href));
  const page = errorPages[kind];

  return (
    <Page
      breadcrumb={section ? `Moderación / ${section.label}` : "Moderación"}
      title={page.title}
      actions={
        counts?.reports !== undefined && (
          <Chip label={`${counts.reports} abiertos`} variant="accent" size="header" />
        )
      }
    >
      <ErrorMessage
        kind={kind}
        // ante un error inesperado se recarga; en los demas se vuelve al dashboard
        onAction={() =>
          kind === "unexpected" ? window.location.reload() : navigate("/dashboard", { replace: true })
        }
      />
    </Page>
  );
}

export const NotFoundPage = () => <ErrorPage kind="not-found" />;

// limite de errores de las paginas de la consola: un 404 del loader muestra "no encontrado"
export function RouteErrorPage() {
  const error = useRouteError();
  const kind: ErrorKind = isRouteErrorResponse(error) && error.status === 404 ? "not-found" : "unexpected";
  if (kind === "unexpected") console.error(error);
  return <ErrorPage kind={kind} />;
}

// error antes de tener consola que mostrar, como no poder leer la sesion
export function RootErrorPage() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <ErrorMessage kind="unexpected" onAction={() => window.location.reload()} />
    </div>
  );
}
