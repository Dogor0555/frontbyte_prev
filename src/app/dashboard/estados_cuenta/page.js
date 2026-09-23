import EstadosCuentaView from "./estadosCuenta.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function EstadosCuentaPage() {
    await checkPermissionAndRedirect("Ver Estados Cuenta");

    const cookieStore = await cookies();
    const cookie = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const authStatus = await checkAuthStatus(cookie);
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    let clientes = [];
    try {
        const resp = await fetch(`${API_BASE_URL}/clientes/getAllCli`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" });
        if (resp.ok) clientes = await resp.json();
    } catch (error) {
        console.error("Error al obtener clientes:", error);
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
            <EstadosCuentaView user={authStatus.user} hasHaciendaToken={authStatus.hasHaciendaToken} haciendaStatus={authStatus.haciendaStatus} clientes={Array.isArray(clientes) ? clientes : []} />
        </Suspense>
    );
}
