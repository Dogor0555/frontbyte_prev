import CreditosLoteView from "./creditosLote.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function CreditosLotePage() {
    await checkPermissionAndRedirect("Créditos Lote");

    const cookieStore = await cookies();
    const cookie = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const authStatus = await checkAuthStatus(cookie);
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    let initialCreditos = { data: [], total: 0, page: 1, pages: 1 };
    try {
        const resp = await fetch(`${API_BASE_URL}/creditos-lote?page=1&limit=20`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" });
        if (resp.ok) initialCreditos = await resp.json();
    } catch (error) {
        console.error("Error al obtener créditos lote:", error);
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
            <CreditosLoteView user={authStatus.user} hasHaciendaToken={authStatus.hasHaciendaToken} haciendaStatus={authStatus.haciendaStatus} initialCreditos={initialCreditos} />
        </Suspense>
    );
}
