'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className={isAdmin ? 'gradient-admin-header' : 'gradient-header'}>
      <div className="max-w-7xl mx-auto px-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold m-0">
          🗺️ Travel Planner{isAdmin && ' - Admin'}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-white/90">
            Welcome, {user?.name || 'User'}!
          </span>
          <button
            onClick={handleLogout}
            className="bg-white/20 text-white border border-white px-5 py-2 rounded-lg
                       hover:bg-white/30 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
