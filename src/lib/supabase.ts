import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, Task, TaskStatus } from '../types/crm.ts';

const STORAGE_KEY_CONFIG = 'crm_supabase_config';
const STORAGE_KEY_TASKS = 'crm_kanban_tasks_local';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          tableName: parsed.tableName || 'tasks',
        };
      }
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase do localStorage', e);
  }

  // Fallback to Vite env variables if defined
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    tableName: 'tasks',
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  cachedClient = null; // Reset cache so new client is instantiated
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Local Storage helpers for fallback persistence
export function getLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao recuperar tarefas locais:', err);
  }
  return []; // STRICT REQUIREMENT: No dummy data!
}

export function saveLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Erro ao salvar tarefas locais:', err);
  }
}

export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const targetConfig = config || getStoredSupabaseConfig();
  if (!targetConfig.url || !targetConfig.anonKey) {
    return { success: false, message: 'URL e Chave Anon do Supabase são obrigatórias.' };
  }

  try {
    const tempClient = createClient(targetConfig.url.trim(), targetConfig.anonKey.trim());
    const tableName = targetConfig.tableName || 'tasks';

    // Try a simple select of 1 record
    const { error } = await tempClient.from(tableName).select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: `Conectado ao Supabase, porém a tabela "${tableName}" ainda não existe no seu banco de dados. Use o script SQL fornecido para criá-la.`,
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message} (${error.code || 'sem código'})`,
      };
    }

    return { success: true, message: `Conexão bem-sucedida! A tabela "${tableName}" está pronta.` };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição: ${err?.message || 'Verifique sua URL e Chave'}` };
  }
}

export async function fetchTasks(client: SupabaseClient | null, tableName = 'tasks'): Promise<{ tasks: Task[]; fromSupabase: boolean; error?: string }> {
  if (!client) {
    return { tasks: getLocalTasks(), fromSupabase: false };
  }

  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar do Supabase, recorrendo a tarefas locais:', error);
      return { tasks: getLocalTasks(), fromSupabase: false, error: error.message };
    }

    // Map database rows to Task objects safely
    const formattedTasks: Task[] = (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || 'Sem título',
      description: row.description || '',
      status: (['nao_iniciado', 'em_andamento', 'finalizado'].includes(row.status) ? row.status : 'nao_iniciado') as TaskStatus,
      priority: (['baixa', 'media', 'alta', 'urgente'].includes(row.priority) ? row.priority : 'media'),
      contact_name: row.contact_name || undefined,
      contact_email: row.contact_email || undefined,
      contact_phone: row.contact_phone || undefined,
      company: row.company || undefined,
      deal_value: typeof row.deal_value === 'number' ? row.deal_value : (row.deal_value ? Number(row.deal_value) : undefined),
      due_date: row.due_date || undefined,
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
      checklist: Array.isArray(row.checklist) ? row.checklist : (typeof row.checklist === 'string' ? JSON.parse(row.checklist || '[]') : []),
      notes: row.notes || undefined,
      position: typeof row.position === 'number' ? row.position : 0,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    // Cache locally as well
    saveLocalTasks(formattedTasks);
    return { tasks: formattedTasks, fromSupabase: true };
  } catch (err: any) {
    console.error('Exceção ao buscar tarefas:', err);
    return { tasks: getLocalTasks(), fromSupabase: false, error: err?.message };
  }
}

export async function upsertTask(client: SupabaseClient | null, task: Task, tableName = 'tasks'): Promise<{ success: boolean; error?: string }> {
  // Always update local cache first
  const localList = getLocalTasks();
  const existingIdx = localList.findIndex(t => t.id === task.id);
  let updatedList: Task[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = task;
  } else {
    updatedList = [task, ...localList];
  }
  saveLocalTasks(updatedList);

  if (!client) {
    return { success: true };
  }

  try {
    // Ensure position is a safe number within Postgres integer range
    let safePosition = 0;
    if (typeof task.position === 'number' && !isNaN(task.position)) {
      safePosition = task.position > 2147483640 ? Math.floor(task.position / 1000) : Math.floor(task.position);
    }

    const payload = {
      id: task.id,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      contact_name: task.contact_name || null,
      contact_email: task.contact_email || null,
      contact_phone: task.contact_phone || null,
      company: task.company || null,
      deal_value: task.deal_value ?? null,
      due_date: task.due_date || null,
      tags: task.tags || [],
      checklist: task.checklist || [],
      notes: task.notes || null,
      position: safePosition,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from(tableName).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Falha de rede ao salvar tarefa:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteTask(client: SupabaseClient | null, taskId: string, tableName = 'tasks'): Promise<{ success: boolean; error?: string }> {
  // Update local
  const localList = getLocalTasks().filter(t => t.id !== taskId);
  saveLocalTasks(localList);

  if (!client) {
    return { success: true };
  }

  try {
    const { error } = await client.from(tableName).delete().eq('id', taskId);
    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export function getSupabaseSQLScript(tableName = 'tasks'): string {
  return `-- ====================================================================
-- SCRIPT SQL COMPLETO: TABELA DO CRM + POLÍTICAS DE ACESSO + STORAGE
-- Cole e execute no "SQL Editor" do painel do seu projeto Supabase
-- ====================================================================

-- 1. CRIAÇÃO DA TABELA DE TAREFAS/NEGÓCIOS
create table if not exists public.${tableName} (
  id text primary key,
  title text not null,
  description text,
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'finalizado')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  contact_name text,
  contact_email text,
  contact_phone text,
  company text,
  deal_value numeric,
  due_date text,
  tags jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  notes text,
  position bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir tipo bigint para o campo position se a tabela já existia anteriormente
alter table public.${tableName} alter column position type bigint;

-- 2. ÍNDICES PARA ALTA PERFORMANCE
create index if not exists idx_${tableName}_status on public.${tableName}(status);
create index if not exists idx_${tableName}_position on public.${tableName}(position);
create index if not exists idx_${tableName}_created_at on public.${tableName}(created_at desc);

-- 3. GATILHO (TRIGGER) PARA ATUALIZAR 'updated_at' AUTOMATICAMENTE
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_set_updated_at on public.${tableName};
create trigger trigger_set_updated_at
before update on public.${tableName}
for each row
execute function public.handle_updated_at();

-- 4. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) NA TABELA
alter table public.${tableName} enable row level security;

-- Limpeza preventiva de políticas existentes (para permitir re-execução segura)
drop policy if exists "Permitir leitura total de tarefas" on public.${tableName};
drop policy if exists "Permitir inserção de tarefas" on public.${tableName};
drop policy if exists "Permitir atualização de tarefas" on public.${tableName};
drop policy if exists "Permitir exclusão de tarefas" on public.${tableName};

-- Políticas de RLS da Tabela (Permite acesso para clientes anon e autenticados)
create policy "Permitir leitura total de tarefas"
  on public.${tableName}
  for select
  using (true);

create policy "Permitir inserção de tarefas"
  on public.${tableName}
  for insert
  with check (true);

create policy "Permitir atualização de tarefas"
  on public.${tableName}
  for update
  using (true)
  with check (true);

create policy "Permitir exclusão de tarefas"
  on public.${tableName}
  for delete
  using (true);

-- ====================================================================
-- 5. CONFIGURAÇÃO DO SUPABASE STORAGE (ARMAZENAMENTO DE ARQUIVOS/ANEXOS)
-- ====================================================================

-- Criação do Bucket de Armazenamento 'crm-attachments' caso não exista
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-attachments',
  'crm-attachments',
  true,
  52428800, -- Limite de 50MB por arquivo
  null      -- Aceita todos os tipos de arquivos/documentos
)
on conflict (id) do update set
  public = true;

-- Limpeza preventiva de políticas de storage
drop policy if exists "Visualizar arquivos publicamente" on storage.objects;
drop policy if exists "Fazer upload de arquivos" on storage.objects;
drop policy if exists "Atualizar arquivos armazenados" on storage.objects;
drop policy if exists "Excluir arquivos armazenados" on storage.objects;

-- Políticas de Armazenamento (Storage RLS em storage.objects)
create policy "Visualizar arquivos publicamente"
  on storage.objects
  for select
  using (bucket_id = 'crm-attachments');

create policy "Fazer upload de arquivos"
  on storage.objects
  for insert
  with check (bucket_id = 'crm-attachments');

create policy "Atualizar arquivos armazenados"
  on storage.objects
  for update
  using (bucket_id = 'crm-attachments')
  with check (bucket_id = 'crm-attachments');

create policy "Excluir arquivos armazenados"
  on storage.objects
  for delete
  using (bucket_id = 'crm-attachments');
`;
}
