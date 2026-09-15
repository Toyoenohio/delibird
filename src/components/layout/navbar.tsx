import React, { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, User, Shield, Mail } from "lucide-react";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export function Navbar() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
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
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
      <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="flex items-center">
          <img
            src="/logo-light.png"
            alt="Sobrenombre"
            className="h-8 w-auto object-contain block dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Sobrenombre"
            className="h-8 w-auto object-contain hidden dark:block"
          />
        </div>
        <div className="hidden sm:block border-l border-border pl-3">
          <h1 className="text-xs font-semibold tracking-tight text-foreground leading-tight">
            Correos Multi-Sitio
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Panel de registros y formularios
          </p>
        </div>
      </a>

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
