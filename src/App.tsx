/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskPriority, TaskStatus, SupabaseConfig } from './types/crm.ts';
import { 
  getSupabaseClient, 
  fetchTasks, 
  upsertTask, 
  deleteTask, 
  getStoredSupabaseConfig 
} from './lib/supabase.ts';
import { Header } from './components/Header.tsx';
import { StatsBar } from './components/StatsBar.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { Database, Plus, Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // STRICT REQUIREMENT: No dummy data! Initial list is empty [].
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('nao_iniciado');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Discrete notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSupabaseBanner, setShowSupabaseBanner] = useState(true);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Check connection and load tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    const config = getStoredSupabaseConfig();
    const hasCredentials = Boolean(config.url && config.anonKey);
    const client = hasCredentials ? getSupabaseClient() : null;

    setIsSupabaseConnected(hasCredentials && client !== null);

    const { tasks: loadedTasks, fromSupabase, error } = await fetchTasks(client, config.tableName);
    setTasks(loadedTasks || []);

    if (error && hasCredentials) {
      showToast(`Aviso Supabase: ${error}`, 'error');
    }

    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handler for creating / editing a task
  const handleSaveTask = async (task: Task) => {
    const config = getStoredSupabaseConfig();
    const client = getSupabaseClient();

    // Optimistic UI update
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = task;
        return next;
      }
      return [task, ...prev];
    });

    const isEditing = Boolean(taskToEdit);
    showToast(isEditing ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!', 'success');

    // Persist to Supabase / LocalStorage
    const res = await upsertTask(client, task, config.tableName);
    if (!res.success && client) {
      showToast(`Salvo localmente, erro no Supabase: ${res.error}`, 'error');
    }
  };

  // Handler for status change (Kanban drag or fast click)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    const updatedTask: Task = {
      ...targetTask,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Optimistic state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updatedTask : t))
    );

    const statusNames: Record<TaskStatus, string> = {
      nao_iniciado: 'Não iniciado',
      em_andamento: 'Em Andamento',
      finalizado: 'Finalizado',
    };

    showToast(`Status alterado para "${statusNames[newStatus]}"`, 'info');

    // Persist
    const config = getStoredSupabaseConfig();
    const client = getSupabaseClient();
    await upsertTask(client, updatedTask, config.tableName);
  };

  // Handler for deleting a task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Tarefa excluída', 'info');

    const config = getStoredSupabaseConfig();
    const client = getSupabaseClient();
    await deleteTask(client, taskId, config.tableName);
  };

  // Open modal for new task
  const handleOpenCreateModal = (status: TaskStatus = 'nao_iniciado') => {
    setTaskToEdit(null);
    setDefaultStatusForNew(status);
    setIsTaskModalOpen(true);
  };

  // Open modal to edit existing task
  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setDefaultStatusForNew(task.status);
    setIsTaskModalOpen(true);
  };

  // Handle Supabase configuration update
  const handleSupabaseConfigSaved = (config: SupabaseConfig) => {
    const isNowConfigured = Boolean(config.url && config.anonKey);
    setIsSupabaseConnected(isNowConfigured);
    loadTasks();
    if (isNowConfigured) {
      showToast('Configuração do Supabase salva com sucesso!', 'success');
    } else {
      showToast('Supabase desconectado. Operando em modo local.', 'info');
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query filter (matches title, description, lead name, company, or tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesContact = task.contact_name?.toLowerCase().includes(q);
        const matchesCompany = task.company?.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesContact && !matchesCompany && !matchesTags) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenNewTaskModal={() => handleOpenCreateModal('nao_iniciado')}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onRefresh={loadTasks}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Banner if Supabase is not connected */}
        {!isSupabaseConnected && showSupabaseBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-indigo-950/30 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">
                  Banco de Dados Supabase Pronto para Conectar
                </p>
                <p className="text-slate-400">
                  Você pode usar o CRM normalmente com salvamento local, ou conectar seu projeto Supabase para persistência remota em nuvem.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm"
              >
                Conectar Supabase
              </button>
              <button
                type="button"
                onClick={() => setShowSupabaseBanner(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Analytics & Metrics Strip */}
        <StatsBar tasks={tasks} />

        {/* Global Empty State Banner (when no tasks have been created yet) */}
        {tasks.length === 0 && !isLoading && (
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Quadro Kanban Vazio e Pronto para o Uso
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              Nenhuma tarefa de modelo foi inserida. Crie manualmente suas tarefas para organizar os fluxos de trabalho nos status <strong>Não iniciado</strong>, <strong>Em Andamento</strong> e <strong>Finalizado</strong>.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateModal('nao_iniciado')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Tarefa Manual</span>
            </button>
          </div>
        )}

        {/* Kanban Board with 3 requested status columns */}
        <KanbanBoard
          tasks={filteredTasks}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onOpenCreateModal={handleOpenCreateModal}
        />
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultStatus={defaultStatusForNew}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={handleSupabaseConfigSaved}
        currentTasks={tasks}
        onTasksSynced={loadTasks}
      />
    </div>
  );
}
