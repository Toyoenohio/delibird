"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Check, Shield, User } from "lucide-react";

interface WebsiteOption {
  id: string;
  name: string;
  colorTag: string;
}

interface UserFormModalProps {
  userToEdit?: any | null;
  websites: WebsiteOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserFormModal({
  userToEdit,
  websites,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const [name, setName] = useState(userToEdit?.name || "");
  const [email, setEmail] = useState(userToEdit?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "operator">(
    userToEdit?.role || "operator"
  );
  const [assignedWebsiteIds, setAssignedWebsiteIds] = useState<string[]>(
    userToEdit?.assignedWebsiteIds || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleWebsite = (id: string) => {
    setAssignedWebsiteIds((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = userToEdit ? `/api/users/${userToEdit.id}` : "/api/users";
      const method = userToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          role,
          websiteIds: assignedWebsiteIds,
          assignedWebsiteIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar usuario");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {userToEdit ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {userToEdit ? "Contraseña (dejar en blanco para mantener la actual)" : "Contraseña"}
            </label>
            <input
              type="password"
              required={!userToEdit}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("operator")}
                className={`flex items-center gap-2 p-3 text-xs font-medium rounded-xl border transition-colors ${
                  role === "operator"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="w-4 h-4" />
                <div className="text-left">
                  <div>Operador</div>
                  <div className="text-[10px] opacity-70">Acceso a sitios asignados</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex items-center gap-2 p-3 text-xs font-medium rounded-xl border transition-colors ${
                  role === "admin"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <Shield className="w-4 h-4" />
                <div className="text-left">
                  <div>Administrador</div>
                  <div className="text-[10px] opacity-70">Acceso total a todos los sitios</div>
                </div>
              </button>
            </div>
          </div>

          {/* Website Assignment (Visible if operator) */}
          {role === "operator" && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="block text-xs font-semibold text-foreground">
                Sitios Web Asignados
              </label>
              <p className="text-[11px] text-muted-foreground">
                Selecciona los sitios cuyos correos podrá ver y gestionar este operador:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {websites.map((w) => {
                  const isChecked = assignedWebsiteIds.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      onClick={() => toggleWebsite(w.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-primary focus:ring-0"
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: w.colorTag }}
                      />
                      <span className="truncate">{w.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-secondary hover:bg-muted text-foreground border border-border rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : userToEdit ? "Actualizar Usuario" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
