// src/app/dashboard/facturas-excluidas/page.js
import FacturasExcluidasView from "./facturas-excluidas.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";

export default async function FacturasExcluidasPage() {
    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authStatus = await checkAuthStatus(cookie);
    
    console.log("Usuario completo para facturas excluidas:", authStatus.user);
    console.log("AuthStatus completo:", authStatus);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Obtener facturas iniciales del servidor
    let initialFacturas = null;
    try {
        const response = await fetch(`${API_BASE_URL}/sujeto-excluido?page=1&limit=6`, {
            headers: { Cookie: cookie },
            cache: "no-store",
        });
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                initialFacturas = { data, meta: { total: data.length, page: 1, limit: 6, pages: 1 } };
            } else {
                initialFacturas = { data: data?.data ?? [], meta: data?.meta ?? { total: 0, page: 1, limit: 6, pages: 1 } };
            }
        }
    } catch (error) {
        console.error("Error fetching initial facturas excluidas:", error);
    }

    // Pasar datos al Client Component
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <FacturasExcluidasView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
                initialFacturas={initialFacturas}
            />
        </Suspense>
    );
}