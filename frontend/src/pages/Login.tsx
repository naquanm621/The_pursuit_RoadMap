import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple bypass for prototype
    navigate('/roadmap');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96 border border-purple-500/30">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Pursuit Roadmap</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <input type="email" required className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input type="password" required className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold transition">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
