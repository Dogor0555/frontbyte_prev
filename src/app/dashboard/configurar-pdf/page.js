import ConfigurarPdf from "./configurar-pdf";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization.js";
import { API_BASE_URL } from "@/lib/api";

const API_BASE = `${API_BASE_URL}`;

export default async function ConfigurarPdfPage() {
  // Verificación de permisos
  await checkPermissionAndRedirect("Configurar PDF");

  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const authStatus = await checkAuthStatus(cookie);

  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/auth/login");
  }

  if (authStatus.user.rol !== "admin") {
    console.log(
      "Redirigiendo - Usuario no tiene permisos para configurar PDF. Rol:",
      authStatus.user.rol
    );
    redirect("/dashboard/unauthorized");
  }

  let configuracionPdfData = null;
  try {
    // Intentar obtener la configuración existente para este usuario
    const response = await fetch(`${API_BASE}/configuracion-pdf/current`, {
      method: "GET",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      configuracionPdfData = data.data || null;
      console.log("Configuración de PDF obtenida:", configuracionPdfData);
    } else {
      throw new Error(
        `Error ${response.status} al obtener la configuración de PDF`
      );
    }
  } catch (error) {
    console.error("Error al obtener la configuración de PDF:", error);
  }

  // Obtener información de la sucursal para mostrar en el formulario
  let sucursalData = null;
  try {
    const response = await fetch(
      `${API_BASE}/sucursal/${authStatus.user.idsucursal}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      sucursalData = data.data || null;
    }
  } catch (error) {
    console.error("Error al obtener la sucursal:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <ConfigurarPdf
        configuracionPdf={configuracionPdfData}
        sucursal={sucursalData}
        user={authStatus.user}
        hasHaciendaToken={authStatus.hasHaciendaToken}
        haciendaStatus={authStatus.haciendaStatus}
      />
    </Suspense>
  );
}