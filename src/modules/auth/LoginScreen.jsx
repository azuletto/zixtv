

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from '@heroicons/react/outline';
import { usePlaylistStore } from '../../app/store/playlistStore';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    
    setTimeout(() => {
      if (formData.username === 'demo' && formData.password === 'demo') {
        localStorage.setItem('auth', 'true');
        navigate('/');
      } else {
        setError('Usuário ou senha inválidos');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md"
      >
        {}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-red-600 mb-2">ZixTV</h1>
          <p className="text-gray-400">Faça login para continuar</p>
        </div>

        {}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Digite seu usuário"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Senha</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Credenciais de demonstração:</p>
          <p className="text-gray-300 text-sm">Usuário: demo / Senha: demo</p>
        </div>

        {}
        <div className="mt-6 text-center text-sm">
          <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
            Esqueceu sua senha?
          </a>
          <span className="text-gray-600 mx-2">|</span>
          <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
            Criar conta
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
