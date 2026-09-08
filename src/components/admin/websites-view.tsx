import React, { useEffect, useState } from "react";
import { Globe, Plus, ExternalLink } from "lucide-react";
import { WebsiteFormModal } from "@/components/admin/website-form-modal";

export function WebsitesView() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/websites");
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>Gestión de Sitios Web</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Portales web registrados y auto-detectados desde los correos recibidos
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Sitio Web</span>
        </button>
      </div>

      {/* Websites Grid */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-muted-foreground">Cargando sitios web...</p>
        </div>
      ) : websites.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No hay sitios registrados</p>
          <p className="text-xs text-muted-foreground mt-1">
            Los sitios se crean automáticamente al recibir correos de n8n o puedes registrarlos aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((site) => (
            <div
              key={site.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: site.colorTag || "#ea580c" }}
                    />
                    <div>
                      <h2 className="text-sm font-semibold text-foreground leading-tight">
                        {site.name}
                      </h2>
                    </div>
                  </div>
                </div>

                <div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1.5 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{site.url}</span>
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Estado:</span>
                <span className="text-emerald-600 font-medium">Activo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Website Modal */}
      {isModalOpen && (
        <WebsiteFormModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchWebsites();
          }}
        />
      )}
    </div>
  );
}
