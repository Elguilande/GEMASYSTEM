import { useState } from 'react';
import { Shield, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onSuccess, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || 'Erro ao fazer login');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('Erro na conexão. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060C14] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0D1626] border border-slate-800 rounded-3xl p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Gema</h1>
            <p className="text-sm text-slate-400">Sistema de Armazenamento Seguro</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className="w-full bg-[#060C14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#060C14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/30"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'A autenticar...' : 'Entrar'}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Não tem conta?{' '}
              <button
                onClick={onSwitchToRegister}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 transition-colors font-semibold disabled:opacity-50"
              >
                Criar conta
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-700 pt-4 border-t border-slate-800">
            Autenticação segura com Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
