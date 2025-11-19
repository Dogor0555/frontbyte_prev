// src/app/dashboard/proveedores/page.js
import Proveedores from "./proveedores";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function PageProveedores() {
    // Obtener cookies desde el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación
    const authStatus = await checkAuthStatus(cookie);

    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Solo admin
    if (authStatus.user.rol !== "admin") {
        redirect("/dashboard/unauthorized");
    }

    // Obtener proveedores
    let proveedores = [];
    try {
        const response = await fetch("http://localhost:3000/proveedores/getAll", {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Error al obtener proveedores");
        }

        proveedores = await response.json();
    } catch (error) {
        console.error("Error al obtener los proveedores:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Proveedores
                initialProveedores={proveedores}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}
