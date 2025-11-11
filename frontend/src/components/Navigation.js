import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Home, Send, Layers, Shield, User, LogOut, Phone, Info } from 'lucide-react';
import { API } from '../config';


const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/transactions', label: 'Transactions', icon: Send },
    { path: '/blockchain', label: 'Blockchain', icon: Layers },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  if (user?.role === 'admin') {
    navLinks.splice(3, 0, { path: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="glass-card border-b border-slate-700/50 sticky top-0 z-50" data-testid="main-navigation">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">BlockBank</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive(link.path)
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-lg" data-testid="user-info">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-300">{user?.name}</span>
              {user?.role === 'admin' && (
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Admin</span>
              )}
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-red-400 hover:bg-red-500/10"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 mt-3 overflow-x-auto pb-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  isActive(link.path)
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
