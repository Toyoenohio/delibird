"use client";

import React, { useEffect, useState, useCallback } from "react";
import { EmailFilters } from "@/components/emails/email-filters";
import { EmailTable, EmailListItem } from "@/components/emails/email-table";
import { EmailDetailModal } from "@/components/emails/email-detail-modal";
import { Inbox, RefreshCw, Mail } from "lucide-react";
import Papa from "papaparse";

export default function DashboardPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWebsite, setSelectedWebsite] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Fetch Websites
  const fetchWebsites = useCallback(async () => {
    try {
      const res = await fetch("/api/websites");
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWebsite !== "all") params.append("websiteId", selectedWebsite);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page.toString());
      params.append("limit", "50");

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedWebsite, selectedStatus, searchQuery, startDate, endDate, page]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleResetFilters = () => {
    setSelectedWebsite("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEmails((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (emails.length === 0) return;

    const exportData = emails.map((e) => ({
      Fecha: e.createdAt,
      "Sitio Web": e.websiteName || "Sin asignar",
      "URL Origen": e.sourceUrl,
      Remitente: e.senderName,
      Correo: e.senderEmail,
      Teléfono: e.senderPhone || "",
      Asunto: e.subject,
      Mensaje: e.message,
      Estado: e.status,
    }));

    const csvString = Papa.unparse(exportData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `correos_exportados_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <span>Bandeja Central de Correos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualiza y administra en tiempo real todos los envíos de tus sitios web
          </p>
        </div>

        <button
          onClick={() => fetchEmails()}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-card hover:bg-muted text-foreground border border-border rounded-lg transition-colors shadow-sm"
          title="Actualizar bandeja"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filters Bar */}
      <EmailFilters
        websites={websites}
        selectedWebsite={selectedWebsite}
        onWebsiteChange={(id) => {
          setSelectedWebsite(id);
          setPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(st) => {
          setSelectedStatus(st);
          setPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(d) => {
          setStartDate(d);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(d) => {
          setEndDate(d);
          setPage(1);
        }}
        onResetFilters={handleResetFilters}
        onExportCSV={handleExportCSV}
        totalRecords={total}
      />

      {/* Email Table */}
      <EmailTable
        emails={emails}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onSelectEmail={(id) => setSelectedEmailId(id)}
        onQuickStatusChange={handleQuickStatusChange}
      />

      {/* Email Detail Modal */}
      <EmailDetailModal
        emailId={selectedEmailId}
        onClose={() => setSelectedEmailId(null)}
        onStatusUpdated={(newStatus) => {
          if (selectedEmailId) {
            handleQuickStatusChange(selectedEmailId, newStatus);
          }
        }}
      />
    </div>
  );
}
