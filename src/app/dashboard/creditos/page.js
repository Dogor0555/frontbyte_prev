import CreditosView from "./creditos.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function CreditosPage() {
    await checkPermissionAndRedirect("Ver Créditos");

    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const authStatus = await checkAuthStatus(cookie);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    let initialCreditos = { data: [], meta: { total: 0, page: 1, limit: 6, pages: 1 } };
    try {
        const resp = await fetch(`${API_BASE_URL}/creditos/getAllDteCreditos?page=1&limit=6`, {
            method: "GET",
            headers: { Cookie: cookie },
            credentials: "include",
            cache: "no-store",
        });
        if (resp.ok) {
            const json = await resp.json();
            initialCreditos = Array.isArray(json)
                ? { data: json, meta: { total: json.length, page: 1, limit: 6, pages: 1 } }
                : json;
        }
    } catch (error) {
        console.error("Error al obtener créditos:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <CreditosView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
                initialCreditos={initialCreditos}
            />
        </Suspense>
    );
}