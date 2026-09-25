import React, { useState, useEffect } from 'react';
import { SupabaseConfig, Task } from '../types/crm.ts';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  clearStoredSupabaseConfig, 
  testSupabaseConnection, 
  getSupabaseSQLScript,
  upsertTask,
  getSupabaseClient
} from '../lib/supabase.ts';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  ArrowUpRight,
  ShieldCheck,
  Code
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: SupabaseConfig) => void;
  currentTasks: Task[];
  onTasksSynced: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  currentTasks,
  onTasksSynced,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [tableName, setTableName] = useState('tasks');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTableName(config.tableName || 'tasks');
      setTestResult(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Preencha a URL e a Chave Anon antes de testar.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection({
        url: url.trim(),
        anonKey: anonKey.trim(),
        tableName: tableName.trim() || 'tasks',
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Erro inesperado ao testar conexão' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const config: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'tasks',
    };
    saveStoredSupabaseConfig(config);
    onConfigSaved(config);
    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar o Supabase? Suas tarefas continuarão salvas localmente.')) {
      clearStoredSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConfigSaved({ url: '', anonKey: '', tableName: 'tasks' });
      onClose();
    }
  };

  const handleCopySql = () => {
    const script = getSupabaseSQLScript(tableName.trim() || 'tasks');
    navigator.clipboard.writeText(script);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncLocalToSupabase = async () => {
    if (currentTasks.length === 0) {
      setSyncStatus('Não há tarefas locais para sincronizar.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Sincronizando tarefas locais com o Supabase...');

    try {
      const client = getSupabaseClient();
      if (!client) {
        setSyncStatus('Cliente Supabase não está pronto. Salve as credenciais primeiro.');
        setIsSyncing(false);
        return;
      }

      let count = 0;
      for (const t of currentTasks) {
        const res = await upsertTask(client, t, tableName);
        if (res.success) count++;
      }

      setSyncStatus(`Sucesso! ${count} tarefa(s) sincronizada(s) para a tabela "${tableName}".`);
      onTasksSynced();
    } catch (err: any) {
      setSyncStatus(`Erro durante a sincronização: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Conectar Banco de Dados Supabase
              </h2>
              <p className="text-xs text-slate-400">
                Integração direta com PostgreSQL em nuvem via Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info callout */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-indigo-100">
                Seus dados ficam 100% no seu próprio projeto Supabase
              </p>
              <p className="text-indigo-300/80">
                Basta informar a URL do seu projeto e a chave anônima (anon key), que podem ser encontradas nas configurações de API do seu painel Supabase.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>URL do Projeto Supabase (Project URL) *</span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-normal text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Abrir Supabase Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chave Pública Anônima (anon public key) *
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome da Tabela no Banco de Dados
              </label>
              <input
                type="text"
                placeholder="tasks"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2 border border-slate-700"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Testar Conexão
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`text-xs font-medium flex items-center gap-1.5 ${
                    testResult.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* SQL Script Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-sky-400" />
                Script SQL para criar a tabela no Supabase
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  {showSqlPreview ? 'Ocultar código' : 'Ver código SQL'}
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Script SQL
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              Abra o <strong>SQL Editor</strong> no painel do Supabase, cole o script acima e clique em <strong>Run</strong> para criar a estrutura completa da tabela e as políticas de segurança.
            </p>

            {showSqlPreview && (
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-48 leading-relaxed">
                {getSupabaseSQLScript(tableName.trim() || 'tasks')}
              </pre>
            )}
          </div>

          {/* Sync local tasks to Supabase if any exist */}
          {currentTasks.length > 0 && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Exportar tarefas locais ({currentTasks.length}) para o Supabase
                </p>
                <p className="text-[11px] text-slate-400">
                  Envia as tarefas já criadas manualmente para sua tabela no banco de dados.
                </p>
                {syncStatus && (
                  <p className="text-xs text-sky-400 font-medium mt-1">{syncStatus}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSyncLocalToSupabase}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                Sincronizar
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div>
            {url && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 underline"
              >
                Desconectar Supabase
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-lg shadow-emerald-600/20"
            >
              Salvar e Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
