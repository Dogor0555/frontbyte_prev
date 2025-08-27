"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

export default function LogoutButton({ className = "" }) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Cerrar sesión en ambos sistemas
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                router.push('/auth/login');
                router.refresh();
            } else {
                throw new Error('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Ocurrió un error al cerrar sesión. Por favor intente nuevamente.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${className} ${
                isLoggingOut ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            aria-label="Cerrar sesión"
        >
            {isLoggingOut ? (
                <>
                    <LoadingSpinner size="small" className="text-white" />
                    <span>Cerrrando sesión...</span>
                </>
            ) : (
                <>
                    <FaSignOutAlt className="text-white" />
                    <span>Cerrar sesión</span>
                </>
            )}
        </button>
    );
}