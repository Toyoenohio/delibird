"use client";

import React, { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, User, Shield, Globe, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            MailHub Multi-Sitio
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Panel centralizado de registros y formularios
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 border border-border rounded-full px-3 py-1 bg-muted/40">
            {user.role === "admin" ? (
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <User className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span className="text-xs font-medium text-foreground">{user.name}</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {user.role === "admin" ? "Admin" : "Operador"}
            </span>
          </div>
        )}

        <ThemeToggle />

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors border border-destructive/20 disabled:opacity-50"
          title="Cerrar Sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
