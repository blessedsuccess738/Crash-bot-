import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/sessionManager';
import { motion } from 'framer-motion';
import RemoteBrowser from './RemoteBrowser';
import InstallApp from '../components/InstallApp';

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
  const [newUserEmail, setNewUserEmail] = useState('');
  const [keyDays, setKeyDays] = useState(30);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
      
      setStats({
        totalUsers: data.length,
        activeKeys: data.filter((u: any) => u.access_key).length,
        systemHealth: '100% Operational'
      });
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUserEmail })
    });
    setNewUserEmail('');
    fetchUsers();
  };

  const generateKey = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: keyDays })
    });
    fetchUsers();
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const isAdmin = currentRole !== 'admin';
    await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin })
    });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    fetchUsers();
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

        <InstallApp />

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl mb-8">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
            <h2 className="font-bold text-lg">User Management</h2>
            <form onSubmit={addUser} className="flex gap-2">
              <input 
                type="email" 
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                placeholder="Add user email..."
                className="bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:border-emerald-500 outline-none"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-sm font-bold">
                Add User
              </button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-4">User Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Access Key</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">
                    Actions 
                    <span className="ml-2 text-[10px] normal-case opacity-70">
                      (Key Days: <input type="number" value={keyDays} onChange={e => setKeyDays(Number(e.target.value))} className="w-8 bg-transparent border-b border-gray-500 text-center" />)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-medium">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {user.role ? user.role.toUpperCase() : 'USER'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-300">
                      {user.access_key ? (
                        <div className="flex flex-col">
                          <span className="bg-gray-900 px-2 py-1 rounded border border-gray-600 text-emerald-400">
                            {user.access_key}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1">
                            Expires: {new Date(user.access_expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No Key</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => generateKey(user.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                      >
                        Gen Key
                      </button>
                      <button 
                        onClick={() => toggleAdmin(user.id, user.role)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                          user.role === 'admin'
                            ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 border border-purple-600/30' 
                            : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/40 border border-gray-600/30'
                        }`}
                      >
                        {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/30 px-3 py-1 rounded text-xs font-bold transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RemoteBrowser />
      </div>
    </div>
  );
}
