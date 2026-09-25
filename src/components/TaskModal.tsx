import React, { useState, useEffect } from 'react';
import { ChecklistItem, Task, TaskPriority, TaskStatus } from '../types/crm.ts';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  DollarSign, 
  Tag, 
  CheckSquare, 
  AlignLeft,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  defaultStatus = 'nao_iniciado',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('nao_iniciado');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [dealValue, setDealValue] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistItemInput, setChecklistItemInput] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'crm' | 'checklist'>('geral');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status || 'nao_iniciado');
      setPriority(taskToEdit.priority || 'media');
      setContactName(taskToEdit.contact_name || '');
      setCompany(taskToEdit.company || '');
      setContactEmail(taskToEdit.contact_email || '');
      setContactPhone(taskToEdit.contact_phone || '');
      setDealValue(taskToEdit.deal_value !== undefined && taskToEdit.deal_value !== null ? String(taskToEdit.deal_value) : '');
      setDueDate(taskToEdit.due_date || '');
      setTags(taskToEdit.tags || []);
      setChecklist(taskToEdit.checklist || []);
      setNotes(taskToEdit.notes || '');
    } else {
      // Clean form for new task (Strictly no dummy/mock data!)
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('media');
      setContactName('');
      setCompany('');
      setContactEmail('');
      setContactPhone('');
      setDealValue('');
      setDueDate('');
      setTags([]);
      setChecklist([]);
      setNotes('');
    }
    setValidationError('');
    setActiveTab('geral');
  }, [taskToEdit, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddChecklistItem = () => {
    const text = checklistItemInput.trim();
    if (!text) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text,
      completed: false,
    };
    setChecklist([...checklist, newItem]);
    setChecklistItemInput('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Por favor, informe o título da tarefa.');
      return;
    }

    const numericDealValue = dealValue ? parseFloat(dealValue.replace(',', '.')) : undefined;

    const taskData: Task = {
      id: taskToEdit ? taskToEdit.id : (crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      contact_name: contactName.trim() || undefined,
      company: company.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      deal_value: isNaN(numericDealValue as number) ? undefined : numericDealValue,
      due_date: dueDate || undefined,
      tags: tags.length > 0 ? tags : undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
      notes: notes.trim() || undefined,
      position: taskToEdit?.position ?? Math.floor(Date.now() / 1000),
      created_at: taskToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(taskData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa Manual'}
            </h2>
            <p className="text-xs text-slate-400">
              {taskToEdit ? 'Atualize as informações e o status da tarefa' : 'Preencha os campos para adicionar ao quadro Kanban'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'geral'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Dados Principais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'crm'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Contato & Negócio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'checklist'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Subtarefas ({checklist.length})
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              {/* Status & Priority selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Selector - Required options: Não iniciado, Em Andamento, Finalizado */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Status no Kanban *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStatus('nao_iniciado')}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                        status === 'nao_iniciado'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate w-full text-[11px]">Não iniciado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('em_andamento')}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                        status === 'em_andamento'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                      <span className="truncate w-full text-[11px]">Em Andamento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('finalizado')}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                        status === 'finalizado'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate w-full text-[11px]">Finalizado</span>
                    </button>
                  </div>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente 🔥</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entrar em contato com Cliente X para alinhamento"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Descrição / Objetivo
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes sobre o que precisa ser feito ou escopo da negociação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Due Date & Deal Value row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Data Limite / Prazo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Valor Estimado / Negócio (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Etiquetas / Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Adicionar etiqueta (ex: Proposta, Lead Quente, Follow-up)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                  >
                    Adicionar
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CRM / CONTATO */}
          {activeTab === 'crm' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                Informações de lead, cliente ou empresa associados a esta tarefa no pipeline do CRM.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nome do Contato / Lead
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Silva"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Empresa / Organização
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tech Solutions Ltda"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Notas Internas de Negociação
                </label>
                <textarea
                  rows={4}
                  placeholder="Informações adicionais sobre o cliente, preferências, histórico de conversas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova subtarefa (ex: Enviar contrato assinado)..."
                  value={checklistItemInput}
                  onChange={(e) => setChecklistItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>

              {checklist.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Nenhuma subtarefa adicionada ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item.id)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                        />
                        <span
                          className={`text-xs ${
                            item.completed
                              ? 'line-through text-slate-500'
                              : 'text-slate-200'
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/20"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
