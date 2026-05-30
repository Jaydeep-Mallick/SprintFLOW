import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, X, User, ShieldAlert, KeyRound, Mail, CheckCircle } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('Developer');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load user list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenUserModal();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleOpenUserModal = (u = null) => {
    setError('');
    if (u) {
      setEditingUser(u);
      setUserName(u.name);
      setUserEmail(u.email);
      setUserRole(u.role);
      setUserPassword(''); // Leave blank unless updating password
    } else {
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      setUserRole('Developer');
      setUserPassword('');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: userName,
      email: userEmail,
      role: userRole,
    };

    if (userPassword) {
      payload.password = userPassword;
    } else if (!editingUser) {
      // Password is required for new users
      return setError('Password is required for new users');
    }

    try {
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, payload);
      } else {
        await API.post('/users', payload);
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser._id) {
      return alert('You cannot delete your own admin account.');
    }

    if (confirm('Are you sure you want to permanently delete this user account? This will log them out and remove their records.')) {
      try {
        await API.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Developer': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Client': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      default: return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Opening user directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System User directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user accounts, client linkages, developer team logs, and roles access parameters.
          </p>
        </div>
        <button
          onClick={() => handleOpenUserModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-medium flex items-center justify-center gap-2 text-sm transition-all shrink-0 active:translate-y-px"
        >
          <Plus size={16} />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            placeholder="Search users by name, email, or role..."
          />
        </div>
      </div>

      {/* Users table */}
      <div className="glass-panel overflow-hidden p-6 space-y-4">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No users found matching your search criteria.</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">System Role</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-200 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{u.name} {u._id === currentUser._id && <span className="text-[10px] text-slate-500">(You)</span>}</span>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenUserModal(u)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-slate-200 border border-slate-800 rounded transition-all inline-block"
                        title="Edit User"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        disabled={u._id === currentUser._id}
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950/20 text-slate-450 hover:text-rose-400 border border-slate-800 rounded transition-all inline-block disabled:opacity-30 disabled:pointer-events-none"
                        title="Delete User"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT USER MODAL --- */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)}></div>
          <div className="glass-panel w-full max-w-md bg-slate-950 p-6 z-10 space-y-6 relative animate-slide-up">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-xl font-bold text-white">{editingUser ? 'Edit User Credentials' : 'Create User Account'}</h3>
              <p className="text-xs text-slate-500 mt-1">Configure credentials and systems security role classification.</p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                  <ShieldAlert size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
                    placeholder="e.g. Michael Scott"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">System Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Developer">Developer (Assigned Tasks & Timesheets)</option>
                  <option value="Client">Client (Support & Sprints Visibility)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  {editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <KeyRound size={15} />
                  </span>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
