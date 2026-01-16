// src/app/dashboard/nota_remision/page.js
import NotaRemisionView from "./notaRemision.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function NotaRemisionPage() {
    // Verificación de permisos
    // await checkPermissionAndRedirect("Nota de Remision");

    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authStatus = await checkAuthStatus(cookie);
    
    console.log("Usuario completo desde checkAuthStatus:", authStatus.user);
    console.log("AuthStatus completo:", authStatus);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
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
            <NotaRemisionView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}