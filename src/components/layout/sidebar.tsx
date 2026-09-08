"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  UploadCloud,
  Globe,
  Users,
  ShieldAlert,
  Code2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      title: "Bandeja de Correos",
      href: "/",
      icon: Inbox,
      active: pathname === "/",
    },
    {
      title: "Importar CSV",
      href: "/import",
      icon: UploadCloud,
      active: pathname === "/import",
    },
  ];

  const adminItems = [
    {
      title: "Sitios Web",
      href: "/admin/websites",
      icon: Globe,
      active: pathname.startsWith("/admin/websites"),
    },
    {
      title: "Usuarios y Permisos",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      title: "Guía de Integración API",
      href: "/admin/integration",
      icon: Code2,
      active: pathname.startsWith("/admin/integration"),
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/50 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Principal
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {user?.role === "admin" && (
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Administración</span>
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground flex items-center gap-1">
          <span>Neon PostgreSQL</span>
        </p>
        <p className="text-[11px] leading-relaxed">
          Base de datos serverless multi-tenant con partición por sitio web.
        </p>
      </div>
    </aside>
  );
}
