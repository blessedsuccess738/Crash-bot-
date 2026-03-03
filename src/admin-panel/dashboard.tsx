import React, { useState, useEffect } from 'react';
import { useAuth } from '../client/auth/sessionManager';
import { motion } from 'framer-motion';

interface UserData {
  id: string;
  email: string;
  hasAccessKey: boolean;
  accessKey?: string;
  lastLogin: string;
  ip: string;
  status: 'active' | 'banned';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeKeys: 0, systemHealth: 'Good' });

  useEffect(() => {
    // Mock fetching users
    const mockUsers: UserData[] = [
      { id: '1', email: 'user1@example.com', hasAccessKey: true, accessKey: 'ACCESS-123', lastLogin: '2023-10-25 10:30', ip: '192.168.1.1', status: 'active' },
      { id: '2', email: 'user2@example.com', hasAccessKey: false, lastLogin: '2023-10-25 11:00', ip: '192.168.1.2', status: 'active' },
      { id: '3', email: 'banned@example.com', hasAccessKey: false, lastLogin: '2023-10-24 09:15', ip: '10.0.0.5', status: 'banned' },
    ];
    setUsers(mockUsers);
    setStats({
      totalUsers: mockUsers.length,
      activeKeys: mockUsers.filter(u => u.hasAccessKey).length,
      systemHealth: '98% Uptime'
    });
  }, []);

  const generateKey = (userId: string) => {
    const newKey = `ACCESS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, hasAccessKey: true, accessKey: newKey };
      }
      return u;
    }));
  };

  const toggleBan = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'banned' : 'active' };
      }
      return u;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Admin Control Panel</h1>
            <p className="text-gray-400">System Overview & User Management</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Total Users</div>
              <div className="text-xl font-bold">{stats.totalUsers}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Active Keys</div>
              <div className="text-xl font-bold text-emerald-400">{stats.activeKeys}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">System Health</div>
              <div className="text-xl font-bold text-blue-400">{stats.systemHealth}</div>
            </div>
          </div>
        </header>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h2 className="font-bold text-lg">User Management</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-4">User Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Access Key</th>
                  <th className="p-4">Last Login / IP</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-medium">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-300">
                      {user.hasAccessKey ? (
                        <span className="bg-gray-900 px-2 py-1 rounded border border-gray-600">
                          {user.accessKey}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">No Key</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      <div>{user.lastLogin}</div>
                      <div className="text-xs opacity-60 font-mono">{user.ip}</div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!user.hasAccessKey && (
                        <button 
                          onClick={() => generateKey(user.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Generate Key
                        </button>
                      )}
                      <button 
                        onClick={() => toggleBan(user.id)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                          user.status === 'active' 
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/30' 
                            : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-600/30'
                        }`}
                      >
                        {user.status === 'active' ? 'Ban User' : 'Unban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
