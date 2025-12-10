import AnularCreditoView from "./anularCredito.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function AnularFacturaPage() {
    // Verificación de permisos
    await checkPermissionAndRedirect("Anular Créditos");

    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const authStatus = await checkAuthStatus(cookie);
    
    console.log("Usuario completo desde checkAuthStatus:", authStatus.user);
    console.log("AuthStatus completo:", authStatus);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }
    
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <AnularCreditoView 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}