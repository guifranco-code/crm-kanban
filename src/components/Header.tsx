import React from 'react';
import { Database, Plus, RefreshCw, Search, SlidersHorizontal, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TaskPriority } from '../types/crm.ts';

interface HeaderProps {
  onOpenNewTaskModal: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTaskModal,
  onOpenSupabaseModal,
  isSupabaseConnected,
  onRefresh,
  isLoading,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <span className="text-white font-extrabold text-lg">CRM</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  CRM Kanban
                </h1>
                {/* Supabase status badge */}
                <button
                  type="button"
                  onClick={onOpenSupabaseModal}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    isSupabaseConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title={
                    isSupabaseConnected
                      ? 'Conectado ao Supabase. Clique para gerenciar.'
                      : 'Executando em modo local. Clique para conectar seu Supabase.'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Conectar Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Gestão manual de tarefas nos status Não iniciado, Em Andamento e Finalizado
              </p>
            </div>
          </div>

          {/* Search, Filter & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, lead, empresa..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilterChange(e.target.value)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Todas Prioridades</option>
                <option value="urgente">Urgente 🔥</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Recarregar tarefas"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Supabase Button */}
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              title="Configurar credenciais do banco Supabase"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
            </button>

            {/* Primary Action: New Task */}
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
