import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 text-brand-600 font-bold text-xl tracking-tight">
          <div className="bg-brand-50 p-2 rounded-xl border border-brand-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-brand-600" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-800">
            AI Interview Prep Kit
          </span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <Link
              to="/new"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Kit</span>
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

