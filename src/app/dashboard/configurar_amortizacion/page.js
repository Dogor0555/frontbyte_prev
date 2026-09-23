import ConfigAmortizacionView from "./configAmortizacion.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function ConfigAmortizacionPage() {
    await checkPermissionAndRedirect("Configurar Amortización");

    const cookieStore = await cookies();
    const cookie = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const authStatus = await checkAuthStatus(cookie);
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    let configs = [];
    try {
        const resp = await fetch(`${API_BASE_URL}/amortizacion-config`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" });
        if (resp.ok) configs = await resp.json();
    } catch (error) {
        console.error("Error al obtener configs:", error);
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
            <ConfigAmortizacionView user={authStatus.user} hasHaciendaToken={authStatus.hasHaciendaToken} haciendaStatus={authStatus.haciendaStatus} initialConfigs={configs} />
        </Suspense>
    );
}
