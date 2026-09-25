export type TaskStatus = 'nao_iniciado' | 'em_andamento' | 'finalizado';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company?: string;
  deal_value?: number;
  due_date?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  notes?: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  dotColor: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    id: 'nao_iniciado',
    title: 'Não iniciado',
    description: 'Tarefas planejadas aguardando início',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'em_andamento',
    title: 'Em Andamento',
    description: 'Em execução ativa no momento',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    description: 'Tarefas concluídas com sucesso',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
];

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
}
