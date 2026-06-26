// src/app/dashboard/comprobantes_liquidacion/page.js
import LiquidacionView from "./LiquidacionView.js";
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

    // Fetch initial data for server-side pagination
    let initialFacturas = null;
    try {
        const res = await fetch(`${API_BASE_URL}/liquidacion?page=1&limit=6`, {
            headers: { Cookie: cookie },
            cache: "no-store"
        });
        if (res.ok) {
            initialFacturas = await res.json();
        }
    } catch (e) {
        console.error("Error fetching initial liquidacion data:", e);
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
            <LiquidacionView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
                initialFacturas={initialFacturas}
            />
        </Suspense>
    );
}