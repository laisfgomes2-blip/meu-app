"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd verify a token with a backend.
    // For this prototype, we'll use localStorage.
    const loggedIn = localStorage.getItem('isAuthenticated');
    if (loggedIn === 'true') {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
