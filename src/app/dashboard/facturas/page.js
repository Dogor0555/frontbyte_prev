// src/app/dashboard/facturas/page.js
import FacturasView from "./facturas.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";

export default async function FacturasPage() {
    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authStatus = await checkAuthStatus(cookie);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Obtener primera página de facturas (server-side)
    let initialFacturas = { data: [], meta: { total: 0, page: 1, limit: 6, pages: 1 } };
    try {
        const resp = await fetch(`${API_BASE_URL}/facturas/getAllDteFacturas?page=1&limit=6`, {
            method: "GET",
            headers: { Cookie: cookie },
            credentials: "include",
            cache: "no-store",
        });
        if (resp.ok) {
            const json = await resp.json();
            initialFacturas = Array.isArray(json)
                ? { data: json, meta: { total: json.length, page: 1, limit: 6, pages: 1 } }
                : json;
        }
    } catch (error) {
        console.error("Error al obtener facturas:", error);
    }

    // Pasar datos al Client Component
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <FacturasView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
                initialFacturas={initialFacturas}
            />
        </Suspense>
    );
}