"use client";

import React, { useState } from "react";
import { formatDate, cleanPhone, getWhatsAppUrl, extractDomain, getDomainColor } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import {
  Mail,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Inbox,
} from "lucide-react";

export interface EmailListItem {
  id: string;
  websiteId: string | null;
  websiteName: string | null;
  websiteColor: string | null;
  sourceUrl: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  subject: string;
  message: string;
  status: string;
  extraFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface EmailTableProps {
  emails: EmailListItem[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onDeleteEmail?: (id: string, senderName: string) => void;
  onBulkDelete?: () => void;
  onPageChange: (newPage: number) => void;
  onSelectEmail: (id: string) => void;
  onQuickStatusChange: (id: string, newStatus: string) => void;
}

export function EmailTable({
  emails,
  loading,
  total,
  page,
  totalPages,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onDeleteEmail,
  onBulkDelete,
  onPageChange,
  onSelectEmail,
  onQuickStatusChange,
}: EmailTableProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
        <p className="text-sm text-muted-foreground">Cargando registros de correos...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Inbox className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No se encontraron correos</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No hay registros que coincidan con los filtros seleccionados o la automatización en n8n aún no ha insertado datos.
        </p>
      </div>
    );
  }

  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Bulk Action Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive animate-in fade-in duration-150">
          <span className="font-semibold">
            {selectedIds.length} {selectedIds.length === 1 ? "correo seleccionado" : "correos seleccionados"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-3 w-8" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded text-primary focus:ring-0 cursor-pointer"
                  title="Seleccionar todos"
                />
              </th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Sitio Web / Origen</th>
              <th className="py-3 px-4">Remitente</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4">Asunto & Mensaje</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {emails.map((email) => {
              const waUrl = getWhatsAppUrl(email.senderPhone, email.senderName);
              const displayName = email.websiteName || extractDomain(email.sourceUrl);
              const displayColor = email.websiteColor || getDomainColor(displayName);
              const isSelected = selectedIds.includes(email.id);

              return (
                <tr
                  key={email.id}
                  className={`hover:bg-muted/30 transition-colors group cursor-pointer ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                  onClick={() => onSelectEmail(email.id)}
                >
                  {/* Select Checkbox */}
                  <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(email.id)}
                      className="rounded text-primary focus:ring-0 cursor-pointer"
                    />
                  </td>
                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={email.status}
                      onChange={(e) => onQuickStatusChange(email.id, e.target.value)}
                      className="text-xs bg-transparent border-none cursor-pointer focus:ring-1 focus:ring-primary rounded p-0 font-medium text-foreground"
                    >
                      <option value="nuevo">🟠 Nuevo</option>
                      <option value="en_proceso">🟡 En Proceso</option>
                      <option value="contactado">🟣 Contactado</option>
                      <option value="cerrado">🟢 Cerrado</option>
                      <option value="spam">🔴 Spam</option>
                    </select>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                    {formatDate(email.createdAt)}
                  </td>

                  {/* Website */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border bg-muted/50">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: displayColor }}
                      />
                      <span className="truncate max-w-[140px]" title={email.sourceUrl}>
                        {displayName}
                      </span>
                    </span>
                  </td>

                  {/* Sender Name & Email */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-foreground text-xs">{email.senderName}</div>
                    <div className="text-muted-foreground text-[11px]">{email.senderEmail}</div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                    {email.senderPhone || <span className="opacity-40">-</span>}
                  </td>

                  {/* Subject & Message Preview */}
                  <td className="py-3 px-4 max-w-xs md:max-w-md">
                    <div className="font-medium text-foreground truncate">{email.subject}</div>
                    <div className="text-muted-foreground text-[11px] truncate">{email.message}</div>
                  </td>

                  {/* Action Buttons */}
                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`mailto:${email.senderEmail}?subject=Re: ${encodeURIComponent(
                          email.subject
                        )}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Enviar correo"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => onSelectEmail(email.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteEmail && (
                        <button
                          onClick={() => onDeleteEmail(email.id, email.senderName)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Eliminar correo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <span>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({total} registros en total)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
