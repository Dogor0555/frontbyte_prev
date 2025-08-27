"use client";

import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, hasHaciendaToken, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-gray-700">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !hasHaciendaToken) {
        return null; // El hook useAuth ya redirigirá al login
    }

    return children;
}