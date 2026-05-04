import { useState } from 'react';
import { Shield, UserPlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onSuccess, onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!validatePassword()) {
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || 'Erro ao criar conta');
      } else {
        setSuccess('Conta criada com sucesso! Faça login para continuar.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
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
            <p className="text-sm text-slate-400">Criar nova conta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
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
              <p className="text-xs text-slate-600 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Confirmar senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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

            {success && (
              <div className="flex items-start gap-2 p-3 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/30"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {loading ? 'A criar conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Já tem conta?{' '}
              <button
                onClick={onSwitchToLogin}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 transition-colors font-semibold disabled:opacity-50"
              >
                Fazer login
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
