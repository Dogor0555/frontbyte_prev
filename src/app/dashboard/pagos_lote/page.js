import PagosLoteView from "./pagosLote.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function PagosLotePage() {
    await checkPermissionAndRedirect("Registrar Pagos Lote");

    const cookieStore = await cookies();
    const cookie = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const user = await checkAuth(cookie);
    if (!user) redirect("/auth/login");

    const authStatus = await checkAuthStatus(cookie);
    const hasHaciendaToken = authStatus?.hasHaciendaToken ?? false;
    const haciendaStatus = authStatus?.haciendaStatus ?? null;

    let creditosActivos = [];
    let sucursalData = null;

    try {
        const [creditosResp, sucursalResp] = await Promise.all([
            fetch(`${API_BASE_URL}/creditos-lote?estado=activo&limit=100`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" }),
            user.idsucursal ? fetch(`${API_BASE_URL}/sucursal/${user.idsucursal}`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" }) : null,
        ]);
        if (creditosResp.ok) { const j = await creditosResp.json(); creditosActivos = j.data || []; }
        if (sucursalResp && sucursalResp.ok) { const j = await sucursalResp.json(); sucursalData = j.data; }
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
            <PagosLoteView user={user} sucursalUsuario={sucursalData} hasHaciendaToken={hasHaciendaToken} haciendaStatus={haciendaStatus} creditosActivos={creditosActivos} />
        </Suspense>
    );
}
