import React from 'react';
import { Task } from '../types/crm.ts';
import { CheckCircle2, Clock, DollarSign, ListTodo, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  tasks: Task[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ tasks }) => {
  const total = tasks.length;
  const naoIniciado = tasks.filter(t => t.status === 'nao_iniciado').length;
  const emAndamento = tasks.filter(t => t.status === 'em_andamento').length;
  const finalizado = tasks.filter(t => t.status === 'finalizado').length;

  const totalValue = tasks.reduce((sum, t) => sum + (Number(t.deal_value) || 0), 0);
  const finalizadoValue = tasks
    .filter(t => t.status === 'finalizado')
    .reduce((sum, t) => sum + (Number(t.deal_value) || 0), 0);

  const completionRate = total > 0 ? Math.round((finalizado / total) * 100) : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <ListTodo className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Total de Tarefas</p>
          <p className="text-xl font-bold text-slate-100">{total}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Não Iniciadas</p>
          <p className="text-xl font-bold text-amber-300">{naoIniciado}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Em Andamento</p>
          <p className="text-xl font-bold text-sky-300">{emAndamento}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Finalizadas</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-300">{finalizado}</span>
            {total > 0 && (
              <span className="text-xs font-semibold text-emerald-400/80">({completionRate}%)</span>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <DollarSign className="w-5 h-5" />
        </div>
        <div className="truncate">
          <p className="text-xs text-slate-400 font-medium">Pipeline Total</p>
          <p className="text-lg font-bold text-slate-100 truncate" title={formatCurrency(totalValue)}>
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
};
