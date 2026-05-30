import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import {
  LifeBuoy,
  Plus,
  X,
  MessageSquare,
  Clock,
  User,
  Shield,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Send,
  CornerDownRight
} from 'lucide-react';

const Tickets = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // Detail view

  // Form State
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Bug');
  const [ticketPriority, setTicketPriority] = useState('Medium');

  // Ticket updates / comments state
  const [ticketComments, setTicketComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const isClient = user.role === 'Client';
  const isAdmin = user.role === 'Admin';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tickets');
      setTickets(res.data);

      if (isAdmin) {
        // Fetch users to populate admin assignments
        const userRes = await API.get('/users');
        const adminUsers = userRes.data.filter(u => u.role === 'Admin');
        setAdmins(adminUsers);
      }
    } catch (err) {
      console.error('Failed to load tickets catalog:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setShowCreateModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleOpenTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      // Re-fetch ticket to get populated comments thread
      const res = await API.get(`/tickets/${ticket._id}`);
      setSelectedTicket(res.data);
      setTicketComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to fetch ticket comments thread:', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const payload = {
      title: ticketTitle,
      description: ticketDesc,
      category: ticketCategory,
      priority: ticketPriority,
    };

    try {
      await API.post('/tickets', payload);
      setShowCreateModal(false);
      setTicketTitle('');
      setTicketDesc('');
      setTicketCategory('Bug');
      setTicketPriority('Medium');
      fetchTickets();
    } catch (err) {
      alert('Error creating support ticket: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateTicketStatus = async (ticketId, statusVal) => {
    try {
      await API.put(`/tickets/${ticketId}`, { status: statusVal });
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: statusVal }));
      }
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket status');
    }
  };

  const handleAssignAdmin = async (ticketId, adminId) => {
    try {
      await API.put(`/tickets/${ticketId}`, { assignedAdmin: adminId || null });
      fetchTickets();
      if (selectedTicket && selectedTicket._id === ticketId) {
        const selectedAdmin = admins.find(a => a._id === adminId);
        setSelectedTicket(prev => ({ ...prev, assignedAdmin: selectedAdmin || null }));
      }
    } catch (err) {
      alert('Failed to assign ticket');
    }
  };

  const handlePostTicketComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await API.post(`/tickets/${selectedTicket._id}/comments`, {
        content: newComment,
      });
      setSelectedTicket(res.data);
      setTicketComments(res.data.comments || []);
      setNewComment('');
    } catch (err) {
      alert('Failed to submit ticket reply comment');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'High': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Resolved': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      default: return 'bg-slate-800 text-slate-500 border border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Opening support catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-left">Support Ticket Hub</h1>
          <p className="text-sm text-slate-400 mt-1 text-left">
            {isClient ? 'Submit support requests, ask questions, and collaborate with administrators.' : 'Review support requests, resolve logs, and assign tickets.'}
          </p>
        </div>
        {isClient && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-medium flex items-center justify-center gap-2 text-sm transition-all shrink-0 animate-fade-in"
          >
            <Plus size={16} />
            <span>Raise Support Ticket</span>
          </button>
        )}
      </div>

      {/* Grid of tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
          <LifeBuoy size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No support tickets created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              onClick={() => handleOpenTicketDetails(ticket)}
              className="glass-panel p-5 space-y-4 hover:border-slate-700/50 cursor-pointer flex flex-col text-left justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[9px] font-bold text-indigo-400 tracking-wider uppercase">
                    {ticket.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 group-hover:text-white leading-snug truncate">
                  {ticket.title}
                </h3>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{ticket.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] text-slate-500">
                <span className={`px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>

                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-600" />
                  <span>
                    {isAdmin ? ticket.client?.name : (ticket.assignedAdmin?.name || 'Unassigned')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE SUPPORT TICKET MODAL --- */}
      {showCreateModal && isClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="glass-panel w-full max-w-md bg-slate-950 p-6 z-10 space-y-6 relative animate-slide-up">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">Raise Support Ticket</h3>
              <p className="text-xs text-slate-500 mt-1">Submit support requests to administrators.</p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Server Database throws 500 error"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  >
                    <option value="Bug">Bug</option>
                    <option value="Change Request">Change Request</option>
                    <option value="Hosting">Hosting</option>
                    <option value="Website Issue">Website Issue</option>
                    <option value="Mobile App Issue">Mobile App Issue</option>
                    <option value="Software Issue">Software Issue</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  required
                  rows={4}
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 resize-none focus:outline-none"
                  placeholder="Describe your issue in detail. Include reproduction steps if relevant..."
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TICKET DETAIL SLIDEOUT VIEW --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="glass-panel w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full z-10 flex flex-col relative animate-slide-left p-0">
            
            {/* Slide Header */}
            <div className="p-6 border-b border-slate-900/80 flex justify-between items-start gap-4">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">{selectedTicket.category}</span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{selectedTicket.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded-lg bg-slate-950"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slide Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/30 border border-slate-900 rounded-lg text-xs text-slate-400 text-left">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Owner</span>
                  <span className="text-slate-200 font-medium">{selectedTicket.client?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Priority</span>
                  <span className={`badge-priority-${selectedTicket.priority?.toLowerCase()} inline-block mt-0.5`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Created At</span>
                  <span className="text-slate-200 font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Assigned Handler</span>
                  {isAdmin ? (
                    <select
                      value={selectedTicket.assignedAdmin?._id || ''}
                      onChange={(e) => handleAssignAdmin(selectedTicket._id, e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none mt-1"
                    >
                      <option value="">Assign Admin</option>
                      {admins.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-slate-200 font-medium">{selectedTicket.assignedAdmin?.name || 'Not Assigned'}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 border border-slate-900 p-4 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Discussion Comment box */}
              <div className="space-y-4 border-t border-slate-900/80 pt-5 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discussion Ticket thread</h4>

                {/* Comment feeds */}
                <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                  {ticketComments.length === 0 ? (
                    <p className="text-[11px] text-slate-600 py-3">No updates yet. Post a message to discuss.</p>
                  ) : (
                    ticketComments.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 border border-slate-900 rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold text-slate-300">{comment.author?.name} ({comment.author?.role})</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post response */}
                <form onSubmit={handlePostTicketComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Reply or post feedback logs..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>

            {/* Slide Actions Footer */}
            <div className="p-6 border-t border-slate-900/80 bg-slate-950/60 flex justify-between gap-3 shrink-0">
              {isAdmin && selectedTicket.status !== 'Resolved' && (
                <button
                  onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'Resolved')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                >
                  Mark as Resolved
                </button>
              )}
              {isClient && selectedTicket.status !== 'Closed' && (
                <button
                  onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'Closed')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold"
                >
                  Close Support Ticket
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
