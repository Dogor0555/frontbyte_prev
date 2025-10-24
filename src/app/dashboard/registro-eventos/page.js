import RegistroEventos from "./RegistroEventos";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function RegistroEventosPage() {
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const authStatus = await checkAuthStatus(cookie);

    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    if (authStatus.user.rol !== "admin") {
        console.log("Redirigiendo - Usuario no es admin. Rol:", authStatus.user.rol);
        redirect("/dashboard/unauthorized");
    }

    let eventos = [];
    try {
        const response = await fetch("http://localhost:3000/registro-eventos/getAll", {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener los eventos`);
        }

        const data = await response.json();
        eventos = data.data || [];
        console.log("Eventos obtenidos:", eventos.length);
    } catch (error) {
        console.error("Error al obtener los eventos:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <RegistroEventos 
                initialEventos={eventos}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}
