import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

/**
 * Verifica los permisos del usuario en el servidor.
 * Si el usuario no tiene el permiso requerido (o no es Administrador),
 * lo redirige a la página de no autorizado.
 * 
 * @param {string} requiredPermission - El nombre del permiso necesario para acceder a la página.
 */
export async function checkPermissionAndRedirect(requiredPermission) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  if (allCookies.length === 0) {
    redirect("/auth/login"); 
  }

  try {
    const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const response = await fetch(`${API_BASE_URL}/permisos/`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      // Si la API de permisos falla, denegamos el acceso por seguridad
      console.error('Error al cargar permisos desde el servidor:', response.status);
      redirect("/dashboard/unauthorized");
    }

    const data = await response.json();
    const userPermissions = data.permisos || [];
    console.log('Permisos del usuario:', userPermissions);

    const isAdmin = userPermissions.includes("Administración");
    const hasPermission = userPermissions.includes(requiredPermission);

    if (!isAdmin && !hasPermission) {
      redirect("/dashboard/unauthorized");
    }
  } catch (error) {
    console.error('Error de red al verificar permisos:', error);
    redirect("/dashboard/unauthorized");
  }
}