// src/app/dashboard/notas/emitir/[id]/page.js
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../../../services/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import EmitirNotaCombined from "./emitir_nota";

export default async function EmitirNotaPage({ params }) {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const authStatus = await checkAuthStatus(cookie);
  
  console.log("Usuario completo desde checkAuthStatus:", authStatus.user);
  console.log("AuthStatus completo:", authStatus);
  
  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <EmitirNotaCombined 
        user={authStatus.user}
        hasHaciendaToken={authStatus.hasHaciendaToken}
        haciendaStatus={authStatus.haciendaStatus}
        facturaId={id}
      />
    </Suspense>
  );
}