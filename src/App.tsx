import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cloud,
  Upload,
  Download,
  Wifi,
  WifiOff,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Trash2,
  RefreshCw,
  Shield,
  LogOut,
  User,
} from 'lucide-react';
import { supabase, type User as SupabaseUser } from './lib/supabase';
import { createSocketIOClient, type StorageData } from './lib/socketio';
import Login from './pages/Login';
import Register from './pages/Register';

type StatusType = 'info' | 'success' | 'error' | 'loading';
type AuthPage = 'login' | 'register';

interface StatusMessage {
  id: number;
  type: StatusType;
  text: string;
}

const SESSION_ID = Math.random().toString(36).slice(2, 10).toUpperCase();
const SOCKET_URL = 'https://gemasystem-production.up.railway.app';

function StorageApp({ user }: { user: SupabaseUser }) {
  const [connected, setConnected] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [readName, setReadName] = useState('');
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [entries, setEntries] = useState<StorageData[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readResult, setReadResult] = useState<StorageData | null>(null);
  const socketClientRef = useRef<ReturnType<typeof createSocketIOClient> | null>(null);
  const msgIdRef = useRef(0);

  const addStatus = useCallback((type: StatusType, text: string) => {
    const id = ++msgIdRef.current;
    setStatusMessages(prev => [{ id, type, text }, ...prev].slice(0, 20));
  }, []);

  const connect = useCallback(() => {
    if (connected || socketClientRef.current?.isConnected()) return;

    addStatus('loading', 'A conectar ao servidor Gema via Socket.io...');

    const socketClient = createSocketIOClient(SOCKET_URL, SESSION_ID);
    socketClientRef.current = socketClient;

    socketClient.onDadosEnviados((data) => {
      setIsSending(false);
      if (data.sucesso) {
        addStatus('success', `Dados enviados com sucesso: "${fileName}"`);
        setFileName('');
        setFileContent('');
      } else {
        addStatus('error', `Erro ao enviar dados: ${data.mensagem}`);
      }
    });

    socketClient.onDadosRecebidos((dados: StorageData[]) => {
      setIsReading(false);
      if (dados && dados.length > 0) {
        const resultado = dados[0];
        setReadResult({
          nome: resultado.nome,
          conteudo: resultado.conteudo,
          sessionId: resultado.sessionId,
          timestamp: resultado.timestamp,
        });
        addStatus('success', `Dados recebidos: "${resultado.nome}"`);
      } else {
        addStatus('error', `Nenhum dado encontrado com o nome "${readName}".`);
      }
    });

    socketClient.onNovosDados((dados: StorageData) => {
      setEntries(prev => [dados, ...prev].slice(0, 50));
      if (dados.sessionId !== SESSION_ID) {
        addStatus('info', `Novo dado recebido de outro dispositivo: "${dados.nome}"`);
      }
    });

    socketClient.onErro((erro: string) => {
      addStatus('error', `Erro do servidor: ${erro}`);
    });

    socketClient.connect(
      () => {
        setConnected(true);
        addStatus('success', `Conectado ao servidor Gema | Sessão: ${SESSION_ID}`);
      },
      (error) => {
        setConnected(false);
        addStatus('error', `Erro de conexão: ${error}`);
      }
    );
  }, [connected, addStatus, fileName, readName]);

  const disconnect = useCallback(() => {
    if (socketClientRef.current) {
      socketClientRef.current.disconnect();
      socketClientRef.current = null;
    }
    setConnected(false);
    addStatus('info', 'Desconectado do servidor Gema.');
  }, [addStatus]);

  useEffect(() => {
    return () => {
      if (socketClientRef.current) {
        socketClientRef.current.disconnect();
        socketClientRef.current = null;
      }
    };
  }, []);

  const handleSend = () => {
    if (!fileName.trim()) {
      addStatus('error', 'Por favor, insira um nome para o arquivo ou mensagem.');
      return;
    }
    if (!fileContent.trim()) {
      addStatus('error', 'Por favor, insira o conteúdo a enviar.');
      return;
    }
    if (!connected || !socketClientRef.current?.isConnected()) {
      addStatus('error', 'Não está conectado ao servidor.');
      return;
    }

    setIsSending(true);
    addStatus('loading', `A enviar "${fileName}" para o armazenamento...`);
    socketClientRef.current.enviarDados(fileName.trim(), fileContent.trim());
  };

  const handleRead = () => {
    if (!readName.trim()) {
      addStatus('error', 'Por favor, insira o nome do arquivo ou mensagem a ler.');
      return;
    }
    if (!connected || !socketClientRef.current?.isConnected()) {
      addStatus('error', 'Não está conectado ao servidor.');
      return;
    }

    setIsReading(true);
    setReadResult(null);
    addStatus('loading', `A procurar "${readName}" no armazenamento...`);
    socketClientRef.current.pedirDados(readName.trim());
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Apagar todos os dados do armazenamento?')) return;
    setEntries([]);
    setReadResult(null);
    addStatus('info', 'Armazenamento limpo.');
  };

  const statusIcon = (type: StatusType) => {
    if (type === 'success') return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (type === 'error') return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
    if (type === 'loading') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />;
    return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-[#060C14] text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0A1220]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                Gema - Sistema de Armazenamento Seguro
              </h1>
              <p className="text-xs text-slate-500">Sessão: {SESSION_ID}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {connected ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-900/20 border border-red-800/40 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  Offline
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0D1626] px-3 py-1.5 rounded-full border border-slate-800">
              <User className="w-3.5 h-3.5" />
              {user.email}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Connection controls */}
        <div className="flex gap-3">
          <button
            onClick={connect}
            disabled={connected}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            <Wifi className="w-4 h-4" />
            Conectar
          </button>
          <button
            onClick={disconnect}
            disabled={!connected}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <WifiOff className="w-4 h-4" />
            Desconectar
          </button>
          <button
            onClick={() => {
              if (connected) {
                addStatus('info', 'Estado atualizado.');
              }
            }}
            disabled={!connected}
            title="Atualizar lista"
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Send Section */}
        <div className="bg-[#0D1626] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Enviar para Armazenamento</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Nome do Arquivo ou Mensagem</label>
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="ex: documento.txt, mensagem-secreta..."
              className="w-full bg-[#060C14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Conteúdo</label>
            <textarea
              value={fileContent}
              onChange={e => setFileContent(e.target.value)}
              placeholder="Escreva aqui o conteúdo a enviar para o armazenamento seguro..."
              rows={5}
              className="w-full bg-[#060C14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || !connected}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isSending ? 'A enviar...' : 'Enviar Dados para o Armazenamento'}
          </button>
        </div>

        {/* Read Section */}
        <div className="bg-[#0D1626] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Ler Dados do Armazenamento</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Nome do Arquivo ou Mensagem</label>
            <input
              type="text"
              value={readName}
              onChange={e => setReadName(e.target.value)}
              placeholder="ex: documento.txt, mensagem-secreta..."
              className="w-full bg-[#060C14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          <button
            onClick={handleRead}
            disabled={isReading || !connected}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base bg-cyan-700 hover:bg-cyan-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-900/30"
          >
            {isReading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isReading ? 'A procurar...' : 'Ler Dados do Armazenamento'}
          </button>

          {readResult && (
            <div className="bg-[#060C14] border border-cyan-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm font-semibold text-cyan-300 truncate">{readResult.nome}</span>
                <span className="ml-auto text-xs text-slate-600">{formatTime(readResult.timestamp)}</span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed border-t border-slate-800 pt-3">
                {readResult.conteudo}
              </p>
              <p className="text-xs text-slate-600">Sessão de origem: {readResult.sessionId}</p>
            </div>
          )}
        </div>

        {/* Status Area */}
        <div className="bg-[#0D1626] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Estado do Sistema</h2>
            {statusMessages.length > 0 && (
              <button
                onClick={() => setStatusMessages([])}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {statusMessages.length === 0 ? (
              <p className="text-xs text-slate-600 italic text-center py-4">Nenhuma mensagem de estado ainda.</p>
            ) : (
              statusMessages.map(msg => (
                <div
                  key={msg.id}
                  className="flex items-start gap-2 text-xs py-2 px-3 rounded-lg bg-[#060C14] border border-slate-800/80"
                >
                  {statusIcon(msg.type)}
                  <span className={`leading-relaxed ${
                    msg.type === 'success' ? 'text-emerald-300' :
                    msg.type === 'error' ? 'text-red-300' :
                    msg.type === 'loading' ? 'text-blue-300' :
                    'text-slate-400'
                  }`}>{msg.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Entries */}
        <div className="bg-[#0D1626] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Armazenamento ({entries.length})
              </h2>
            </div>
            {entries.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Apagar tudo
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-xs text-slate-600 italic text-center py-6">
                Nenhum dado armazenado. Envie dados para começar.
              </p>
            ) : (
              entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#060C14] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
                  onClick={() => {
                    setReadName(entry.nome);
                    setReadResult(entry);
                    addStatus('info', `A visualizar: "${entry.nome}"`);
                  }}
                >
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-blue-400 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{entry.nome}</p>
                    <p className="text-xs text-slate-600 truncate">{entry.conteudo.slice(0, 60)}{entry.conteudo.length > 60 ? '...' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-600">{formatTime(entry.timestamp)}</p>
                    <p className="text-xs text-slate-700">{entry.sessionId === SESSION_ID ? 'Eu' : entry.sessionId}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 pb-4">
          Gema Storage &middot; Dados transmitidos via Socket.io &middot; {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthPage('login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060C14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authPage === 'login' ? (
          <Login
            onSuccess={() => setUser(supabase.auth.getSession().then(s => s.data.session?.user || null).catch(() => null))}
            onSwitchToRegister={() => setAuthPage('register')}
          />
        ) : (
          <Register
            onSuccess={() => setAuthPage('login')}
            onSwitchToLogin={() => setAuthPage('login')}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <StorageApp user={user} />
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg"
        title="Fazer logout"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
}
