import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => React.ReactNode;
}

export interface PresetView {
  id: string;
  label: string;
  count?: number;
  filterFn?: (item: any) => boolean;
}

export interface AdvancedDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  presetViews?: PresetView[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  bulkActions?: {
    label: string;
    action: (selectedRows: T[]) => void;
    variant?: 'primary' | 'cardinal' | 'outline' | 'destructive';
  }[];
  emptyMessage?: string;
}

export function AdvancedDataGrid<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  presetViews = [],
  searchPlaceholder = 'Search records...',
  onRowClick,
  bulkActions = [],
  emptyMessage = 'No records match your criteria.',
}: AdvancedDataGridProps<T>) {
  const [activePreset, setActivePreset] = useState(presetViews[0]?.id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = density === 'compact' ? 15 : 10;

  // Filter by active preset
  const presetFilteredData = useMemo(() => {
    if (!activePreset || activePreset === 'all') return data;
    const view = presetViews.find((v) => v.id === activePreset);
    if (view && view.filterFn) {
      return data.filter(view.filterFn);
    }
    return data;
  }, [data, activePreset, presetViews]);

  // Filter by search query
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return presetFilteredData;
    const q = searchQuery.toLowerCase();
    return presetFilteredData.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(q);
        }
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [presetFilteredData, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return searchFilteredData;
    return [...searchFilteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [searchFilteredData, sortKey, sortDirection]);

  // Paginated slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map(rowKey));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Export selected or all visible to CSV
  const handleExportCsv = () => {
    const exportData =
      selectedIds.length > 0
        ? data.filter((row) => selectedIds.includes(rowKey(row)))
        : sortedData;

    const headers = columns.map((c) => c.header).join(',');
    const rows = exportData.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          if (val === undefined || val === null) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* 1. Preset Views Bar */}
      {presetViews.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center gap-1.5 bg-slate-50/60">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter size={11} /> Saved Views:
          </span>
          {presetViews.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset.id);
                  setCurrentPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{preset.label}</span>
                {preset.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {preset.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Search & Controls Ribbon */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        {/* Search Omnibar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Density toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                density === 'comfortable' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Spacious
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                density === 'compact' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Compact
            </button>
          </div>

          {/* Export button */}
          <Button
            variant="outline"
            size="xs"
            onClick={handleExportCsv}
            leftIcon={<Download size={12} />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 3. Bulk Action Floating Strip (When rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="font-semibold">
              {selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((ba, idx) => (
              <Button
                key={idx}
                variant={ba.variant || 'cardinal'}
                size="xs"
                onClick={() => {
                  const selectedRows = data.filter((r) => selectedIds.includes(rowKey(r)));
                  ba.action(selectedRows);
                }}
              >
                {ba.label}
              </Button>
            ))}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white underline ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 4. Result Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80 font-semibold select-none">
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {selectedIds.length > 0 && selectedIds.length === paginatedData.length ? (
                    <CheckSquare size={14} className="text-[#8C1515]" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`py-2.5 px-3.5 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${
                    col.sortable !== false
                      ? 'cursor-pointer hover:bg-slate-100/60 transition-colors'
                      : ''
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : ''
                    }`}
                  >
                    <span>{col.header}</span>
                    {sortKey === col.key && (
                      <span className="text-[#8C1515]">
                        {sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400 text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const id = rowKey(row);
                const isSelected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-red-50/30'
                        : onRowClick
                        ? 'hover:bg-slate-50/80 cursor-pointer'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td
                      className="py-2 px-3 text-center"
                      onClick={(e) => handleToggleRow(id, e)}
                    >
                      <button type="button" className="text-slate-400 hover:text-slate-700">
                        {isSelected ? (
                          <CheckSquare size={14} className="text-[#8C1515]" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${
                          density === 'compact' ? 'py-2 px-3.5' : 'py-3 px-3.5'
                        } ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row, idx) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing{' '}
          <strong>
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedData.length)}
          </strong>{' '}
          of <strong>{sortedData.length}</strong> records
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            leftIcon={<ChevronLeft size={12} />}
          >
            Prev
          </Button>
          <span className="text-xs px-2 font-mono">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            rightIcon={<ChevronRight size={12} />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

