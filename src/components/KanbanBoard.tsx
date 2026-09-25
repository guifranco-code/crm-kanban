import React, { useState } from 'react';
import { COLUMNS, Task, TaskStatus } from '../types/crm.ts';
import { TaskCard } from './TaskCard.tsx';
import { Plus, Inbox } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateModal: (defaultStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onOpenCreateModal,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setActiveDropColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onStatusChange(taskId, columnId);
    }
    setDraggedTaskId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const columnTotalValue = columnTasks.reduce(
          (sum, t) => sum + (Number(t.deal_value) || 0),
          0
        );
        const isDropTarget = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl bg-slate-900/60 border transition-all duration-200 min-h-[560px] ${
              isDropTarget
                ? 'border-indigo-500/80 bg-slate-900/90 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                : 'border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${col.dotColor} ring-4 ${col.bgLight}`} />
                <h2 className="font-semibold text-sm text-slate-100">{col.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${col.badgeBg}`}>
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {columnTotalValue > 0 && (
                  <span
                    className="text-xs font-medium text-slate-400 mr-1"
                    title={`Valor somado nesta coluna: ${formatCurrency(columnTotalValue)}`}
                  >
                    {formatCurrency(columnTotalValue)}
                  </span>
                )}

                <button
                  onClick={() => onOpenCreateModal(col.id)}
                  title={`Adicionar tarefa em ${col.title}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-header description */}
            <div className="px-4 py-1.5 text-[11px] text-slate-400 bg-slate-950/20 border-b border-slate-800/40 flex justify-between items-center">
              <span>{col.description}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Arraste para mover</span>
            </div>

            {/* Column Task Cards / Empty State */}
            <div className="p-3.5 flex flex-col gap-3 flex-1">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800/60 rounded-xl my-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 mb-2.5">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    Nenhuma tarefa em "{col.title}"
                  </p>
                  <p className="text-[11px] text-slate-400 mb-3 max-w-[200px]">
                    Crie tarefas manualmente para organizar seu pipeline.
                  </p>
                  <button
                    onClick={() => onOpenCreateModal(col.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    Nova Tarefa
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                    onDragStart={handleDragStart}
                  />
                ))
              )}

              {/* Quick bottom add task button */}
              {columnTasks.length > 0 && (
                <button
                  onClick={() => onOpenCreateModal(col.id)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:bg-slate-900/40 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar tarefa
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
