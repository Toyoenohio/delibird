"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Globe,
  Copy,
  Check,
  Send,
  MessageCircle,
  MessageSquare,
  Clock,
  Trash2,
} from "lucide-react";
import { formatDate, cleanPhone, getWhatsAppUrl, extractDomain, getDomainColor, STATUS_CONFIG } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface Note {
  id: string;
  note: string;
  createdAt: string;
  userName: string;
  userRole: string;
}

interface StatusHistory {
  id: string;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
  userName: string;
}

interface EmailDetailModalProps {
  emailId: string | null;
  onClose: () => void;
  onStatusUpdated: (newStatus: string) => void;
  onDeleteEmail?: (id: string) => void;
}

export function EmailDetailModal({
  emailId,
  onClose,
  onStatusUpdated,
  onDeleteEmail,
}: EmailDetailModalProps) {
  const [data, setData] = useState<{
    email: any;
    notes: Note[];
    history: StatusHistory[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!emailId) return;
    setLoading(true);
    fetch(`/api/emails/${emailId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res) setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [emailId]);

  if (!emailId) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!data?.email) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) =>
          prev ? { ...prev, email: { ...prev.email, status: newStatus } } : null
        );
        onStatusUpdated(newStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) =>
          prev ? { ...prev, notes: [json.note, ...prev.notes] } : null
        );
        setNewNote("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!emailId || !email) return;
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar permanentemente este correo de "${email.senderName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (onDeleteEmail) {
          onDeleteEmail(emailId);
        }
        onClose();
      } else {
        const json = await res.json();
        alert(json.error || "Error al eliminar el correo");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al eliminar el correo");
    } finally {
      setDeleting(false);
    }
  };

  const email = data?.email;
  const whatsappUrl = email ? getWhatsAppUrl(email.senderPhone, email.senderName) : null;
  const displayName = email?.websiteName || (email ? extractDomain(email.sourceUrl) : "");
  const displayColor = email?.websiteColor || getDomainColor(displayName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {email ? email.subject : "Cargando correo..."}
              </h2>
              {displayName && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: displayColor }}
                  />
                  <span className="text-xs text-muted-foreground">{displayName}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Cargando información del registro...
          </div>
        ) : !email ? (
          <div className="p-12 text-center text-sm text-destructive">
            No se pudo cargar el registro.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Action Bar & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Estado actual:
                </label>
                <select
                  value={email.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <StatusBadge status={email.status} />
              </div>

              {/* Quick Communication Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${email.senderEmail}?subject=Re: ${encodeURIComponent(
                    email.subject
                  )}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Email</span>
                </a>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Sender Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Remitente</p>
                <p className="text-sm font-medium text-foreground">{email.senderName}</p>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`mailto:${email.senderEmail}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {email.senderEmail}
                  </a>
                  <button
                    onClick={() => handleCopy(email.senderEmail, "email")}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Copiar correo"
                  >
                    {copiedField === "email" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Teléfono / Móvil</p>
                <p className="text-sm font-medium text-foreground">
                  {email.senderPhone || "No proporcionado"}
                </p>
                {email.senderPhone && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {email.senderPhone}
                    </span>
                    <button
                      onClick={() => handleCopy(email.senderPhone, "phone")}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Copiar teléfono"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Fecha de Recepción</p>
                <p className="text-xs text-foreground flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDate(email.createdAt)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Página de Origen</p>
                <p className="text-xs text-foreground flex items-center gap-1.5 pt-1 truncate">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate" title={email.sourceUrl}>
                    {email.sourceUrl}
                  </span>
                </p>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Mensaje Recibido
              </h3>
              <div className="p-4 rounded-xl border border-border bg-muted/20 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {email.message}
              </div>
            </div>

            {/* Internal Notes Section */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Notas Internas del Equipo ({data?.notes?.length || 0})</span>
              </h3>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribir una nota interna..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-4 py-2 text-xs font-medium bg-secondary hover:bg-muted text-foreground border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingNote ? "Guardando..." : "Agregar Nota"}
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data?.notes?.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">{n.userName}</span>
                      <span className="text-[10px]">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-foreground leading-normal">{n.note}</p>
                  </div>
                ))}
                {data?.notes?.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2 italic">
                    Sin notas registradas aún.
                  </p>
                )}
              </div>
            </div>

            {/* Status History / Audit Trail */}
            {data?.history && data.history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Historial de Estados</span>
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {data.history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <span className="text-muted-foreground">
                        Por <strong className="text-foreground">{h.userName || "Sistema"}</strong>:{" "}
                        <span className="line-through opacity-70">{h.previousStatus}</span> ➔{" "}
                        <strong className="text-primary">{h.newStatus}</strong>
                      </span>
                      <span className="text-muted-foreground text-[10px]">{formatDate(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? "Eliminando..." : "Eliminar Correo"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-secondary hover:bg-muted text-foreground border border-border rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
