// src/app/dashboard/clientes/page.js
import Clientes from "./clientes";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function ClientesPage() {
  // Obtener cookies en el servidor
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Verificar autenticación y obtener info del usuario
  const authResult = await checkAuthStatus(cookie);

  if (!authResult.isAuthenticated || !authResult.user) {
    redirect("/auth/login");
  }

  // Verificar si el usuario es administrador
  if (authResult.user.rol !== "admin") {
    redirect("/dashboard/unauthorized");
  }

  // Obtener clientes desde la API
  let clientes = [];
  try {
    const response = await fetch("http://localhost:3000/clientes/getAllCli", {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al obtener los clientes`);
    }

    const data = await response.json();
    clientes = data.data || []; // 👈 aquí está el fix
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
  }

  // Renderizar Client Component
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <Clientes initialClientes={clientes} user={authResult.user} />
    </Suspense>
  );
}
