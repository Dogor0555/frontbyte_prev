import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization";
import RentabilidadView from "./rentabilidad";

export default async function RentabilidadPage() {
  await checkPermissionAndRedirect("Rentabilidad", { allowAdministration: false });

  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");
  const authStatus = await checkAuthStatus(cookie);

  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/auth/login");
  }

  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}
    >
      <RentabilidadView
        user={authStatus.user}
        hasHaciendaToken={authStatus.hasHaciendaToken}
        haciendaStatus={authStatus.haciendaStatus}
      />
    </Suspense>
  );
}
