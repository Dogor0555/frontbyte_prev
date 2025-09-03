// src/app/dashboard/reportes/page.js
import Reportes from "../reportes/reporte";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";

export default async function PageReportes() {
  // cookies del request (SSR)
  const cookieStore = await cookies();
  const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

  // auth SSR
  const user = await checkAuth(cookie);
  if (!user) redirect("/auth/login");

  // (opcional) podrías precargar algo aquí y pasarlo como prop
  // pero el componente cliente ya hace sus fetch con filtros

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <Reportes user={user} cookie={cookie} />
    </Suspense>
  );
}
