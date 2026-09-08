"use client";

import React from "react";
import { Search, Filter, Download, RotateCcw } from "lucide-react";
import { STATUS_CONFIG } from "@/lib/utils";

interface WebsiteOption {
  id: string;
  name: string;
  colorTag: string;
}

interface EmailFiltersProps {
  websites: WebsiteOption[];
  selectedWebsite: string;
  onWebsiteChange: (id: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  onExportCSV: () => void;
  totalRecords: number;
}

export function EmailFilters({
  websites,
  selectedWebsite,
  onWebsiteChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onExportCSV,
  totalRecords,
}: EmailFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o asunto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <span className="text-xs text-muted-foreground font-medium">
            Total: <strong className="text-foreground">{totalRecords}</strong> registros
          </span>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border rounded-lg transition-colors shadow-sm"
            title="Exportar a CSV los registros filtrados"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onResetFilters}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
            title="Limpiar todos los filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/60">
        {/* Website Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
            Sitio Web
          </label>
          <select
            value={selectedWebsite}
            onChange={(e) => onWebsiteChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          >
            <option value="all">Todos los sitios web</option>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
            Estado
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
