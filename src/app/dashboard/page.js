// src/app/dashboard/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WelcomeClient from "./welcome-client";
import { Suspense } from "react";
import { checkAuthStatus } from "../services/auth";

export default async function Dashboard() {
  // ✅ Next 15: Dynamic APIs deben ser async
  const cookieStore = await cookies();

  const cookieString = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Verificar estado de autenticación (local y Hacienda)
  const authStatus = await checkAuthStatus(cookieString);

  // Si no está autenticado en nuestro sistema, redirigir
  if (!authStatus.isAuthenticated) {
    redirect("/auth/login");
  }

  // Obtener información del usuario desde la cookie
  const userCookie = cookieStore.get("user");
  let user = { name: "Usuario", role: "Usuario" };

  try {
    if (userCookie?.value) {
      user = JSON.parse(userCookie.value);
    }
  } catch (e) {
    console.error("Error al parsear cookie de usuario:", e);
  }




  // Pasar tanto el usuario como el estado de Hacienda al componente cliente

  return (
    <Suspense fallback={<div className="p-4">Cargando…</div>}>
      <WelcomeClient
        user={user}
        hasHaciendaToken={authStatus?.hasHaciendaToken}
        haciendaStatus={authStatus?.haciendaStatus}
      />
    </Suspense>
  );

  /*
  return (
    <Suspense fallback={<div className="p-4">Cargando…</div>}>
      <WelcomeClient user={user} authStatus={authStatus} />
    </Suspense>
  );*/




}




