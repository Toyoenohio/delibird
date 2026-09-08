import React, { useEffect, useState } from "react";
import { Users, UserPlus, Shield, User as UserIcon, Edit, Trash2 } from "lucide-react";
import { UserFormModal } from "@/components/admin/user-form-modal";
import { formatDate } from "@/lib/utils";

export function UsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, sitesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/websites"),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (sitesRes.ok) {
        const sData = await sitesRes.json();
        setWebsites(sData.websites || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al eliminar usuario");
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getWebsiteName = (id: string) => {
    const found = websites.find((w) => w.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Usuarios y Permisos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra los operadores de la plataforma y asigna los sitios web autorizados
          </p>
        </div>

        <button
          onClick={() => {
            setUserToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Sitios Web Asignados</th>
                  <th className="py-3 px-4">Fecha Creación</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{u.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <UserIcon className="w-3 h-3" />
                          <span>Operador</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === "admin" ? (
                        <span className="text-xs text-muted-foreground italic">
                          Acceso global a todos los sitios
                        </span>
                      ) : u.assignedWebsiteIds?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedWebsiteIds.map((siteId: string) => (
                            <span
                              key={siteId}
                              className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-foreground border border-border"
                            >
                              {getWebsiteName(siteId)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-destructive">Sin sitios asignados</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setUserToEdit(u);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {isModalOpen && (
        <UserFormModal
          userToEdit={userToEdit}
          websites={websites}
          onClose={() => {
            setIsModalOpen(false);
            setUserToEdit(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setUserToEdit(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
