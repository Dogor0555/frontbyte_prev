import LotesView from "./lotes.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function LotesPage() {
    await checkPermissionAndRedirect("Lotes");

    const cookieStore = await cookies();
    const cookie = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const authStatus = await checkAuthStatus(cookie);
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    let initialLotes = { data: [], total: 0, page: 1, pages: 1 };
    let stats = null;
    try {
        const [lotesResp, statsResp] = await Promise.all([
            fetch(`${API_BASE_URL}/lotes?page=1&limit=20`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" }),
            fetch(`${API_BASE_URL}/lotes/stats`, { method: "GET", headers: { Cookie: cookie }, credentials: "include", cache: "no-store" }),
        ]);
        if (lotesResp.ok) initialLotes = await lotesResp.json();
        if (statsResp.ok) stats = await statsResp.json();
    } catch (error) {
        console.error("Error al obtener lotes:", error);
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
            <LotesView user={authStatus.user} hasHaciendaToken={authStatus.hasHaciendaToken} haciendaStatus={authStatus.haciendaStatus} initialLotes={initialLotes} initialStats={stats} />
        </Suspense>
    );
}
