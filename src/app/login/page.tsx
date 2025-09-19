
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // This is a mock login. In a real app, you would have API calls here.
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem('isAuthenticated', 'true');
        toast({
          title: 'Login bem-sucedido!',
          description: 'Bem-vindo de volta.',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro de login',
          description: 'Por favor, preencha todos os campos.',
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-sm border-0 shadow-lg md:border">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center gap-3 mb-4">
             <div className="flex flex-col items-center">
              <Logo className="h-10 w-10 text-primary" />
              <p className="font-cursive text-primary -mt-1 tracking-widest">home</p>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Organiza+
            </h1>
          </div>
          <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
          <CardDescription>
            Entre com suas credenciais para gerenciar suas finanças.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
