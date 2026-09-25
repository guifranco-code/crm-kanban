import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/crm.ts';
import { 
  Building2, 
  Calendar, 
  CheckSquare, 
  Clock, 
  DollarSign, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  User, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; bg: string; text: string; dot: string }> = {
  urgente: {
    label: 'Urgente',
    bg: 'bg-rose-500/15 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  alta: {
    label: 'Alta',
    bg: 'bg-amber-500/15 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  media: {
    label: 'Média',
    bg: 'bg-sky-500/15 border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  baixa: {
    label: 'Baixa',
    bg: 'bg-slate-700/40 border-slate-600/30',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.media;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Format date and check overdue
  const checkDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = due < today && task.status !== 'finalizado';
    const isToday = due.getTime() === today.getTime() && task.status !== 'finalizado';

    return {
      formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      isOverdue,
      isToday,
    };
  };

  const dueDateInfo = checkDueDate(task.due_date);

  // Checklist counts
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onEdit(task)}
      className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top Header: Priority, Deal Value & Quick Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priority.bg} ${priority.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>

          {typeof task.deal_value === 'number' && task.deal_value > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(task.deal_value)}
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Opções da tarefa"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-400" />
                  Editar detalhes
                </button>

                <div className="h-px bg-slate-800 my-1" />

                <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Mudar status:
                </div>

                {task.status !== 'nao_iniciado' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onStatusChange(task.id, 'nao_iniciado');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Não iniciado
                  </button>
                )}

                {task.status !== 'em_andamento' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onStatusChange(task.id, 'em_andamento');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    Em Andamento
                  </button>
                )}

                {task.status !== 'finalizado' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onStatusChange(task.id, 'finalizado');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Finalizado
                  </button>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <button
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir tarefa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors leading-snug mb-1.5">
        {task.title}
      </h3>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Contact & Company Details (CRM Info) */}
      {(task.contact_name || task.company) && (
        <div className="flex flex-col gap-1 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg mb-3 border border-slate-800/60">
          {task.contact_name && (
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-300">{task.contact_name}</span>
            </div>
          )}
          {task.company && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-400">{task.company}</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist Progress */}
      {totalChecklist > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              Subtarefas
            </span>
            <span className="font-medium text-slate-300">
              {completedChecklist}/{totalChecklist}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completedChecklist === totalChecklist ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info: Due Date & Fast Move Status buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
        {/* Due date */}
        {dueDateInfo ? (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              dueDateInfo.isOverdue
                ? 'text-rose-400'
                : dueDateInfo.isToday
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
            title={dueDateInfo.isOverdue ? 'Atrasada!' : dueDateInfo.isToday ? 'Vence hoje!' : 'Data limite'}
          >
            {dueDateInfo.isOverdue ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>{dueDateInfo.formatted}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-mono">
            {new Date(task.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}

        {/* Quick Transition Buttons (for fast 1-click status change without drag-and-drop) */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {task.status === 'nao_iniciado' && (
            <button
              onClick={() => onStatusChange(task.id, 'em_andamento')}
              title="Iniciar tarefa (Mover para Em Andamento)"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition"
            >
              <span>Iniciar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'em_andamento' && (
            <>
              <button
                onClick={() => onStatusChange(task.id, 'nao_iniciado')}
                title="Voltar para Não iniciado"
                className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onStatusChange(task.id, 'finalizado')}
                title="Finalizar tarefa"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Concluir</span>
              </button>
            </>
          )}

          {task.status === 'finalizado' && (
            <button
              onClick={() => onStatusChange(task.id, 'em_andamento')}
              title="Reabrir tarefa (Mover para Em Andamento)"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Reabrir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
