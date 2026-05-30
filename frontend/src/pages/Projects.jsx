import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import {
  Plus,
  Edit2,
  Archive,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  UserPlus,
  Briefcase,
  AlertCircle,
  Mail,
  KeyRound,
  X,
  Target
} from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals Toggles
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Project Form State
  const [projName, setProjName] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [projBudget, setProjBudget] = useState('');
  const [projPriority, setProjPriority] = useState('Medium');
  const [projStatus, setProjStatus] = useState('Planning');
  const [projTeam, setProjTeam] = useState([]);

  // Client Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientError, setClientError] = useState('');

  // Sprint Form State
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  const [sprintStatus, setSprintStatus] = useState('Upcoming');

  const isAdmin = user.role === 'Admin';
  const isClient = user.role === 'Client';

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      setProjects(projRes.data);

      if (isAdmin) {
        const devRes = await API.get('/users/developers');
        const clientRes = await API.get('/users/clients');
        setDevelopers(devRes.data);
        setClients(clientRes.data);
      }
    } catch (error) {
      console.error('Error loading project lists:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenProjectModal();
      // Clear navigation state to prevent re-opening on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- Project CRUD Operations ---
  const handleOpenProjectModal = (proj = null) => {
    if (proj) {
      setEditingProject(proj);
      setProjName(proj.name);
      setProjClient(proj.client?._id || '');
      setProjDesc(proj.description);
      setProjStart(proj.startDate.split('T')[0]);
      setProjEnd(proj.endDate.split('T')[0]);
      setProjBudget(proj.budget);
      setProjPriority(proj.priority);
      setProjStatus(proj.status);
      setProjTeam(proj.assignedTeam.map(d => d._id));
    } else {
      setEditingProject(null);
      setProjName('');
      setProjClient(isClient ? user._id : '');
      setProjDesc('');
      setProjStart('');
      setProjEnd('');
      setProjBudget('');
      setProjPriority('Medium');
      setProjStatus('Planning');
      setProjTeam([]);
    }
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const payload = {
      name: projName,
      client: projClient,
      description: projDesc,
      startDate: projStart,
      endDate: projEnd,
      budget: Number(projBudget),
      priority: projPriority,
      status: projStatus,
      assignedTeam: projTeam,
    };

    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, payload);
      } else {
        await API.post('/projects', payload);
      }
      setShowProjectModal(false);
      fetchData();
    } catch (error) {
      alert('Error saving project: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenClientModal = () => {
    setClientName('');
    setClientEmail('');
    setClientPassword('');
    setClientError('');
    setShowClientModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setClientError('');

    try {
      const res = await API.post('/users', {
        name: clientName,
        email: clientEmail,
        password: clientPassword,
        role: 'Client',
      });
      setClients(prev => [...prev, res.data]);
      setProjClient(res.data._id);
      setShowClientModal(false);
    } catch (error) {
      setClientError(error.response?.data?.message || error.message);
    }
  };

  const handleArchiveProject = async (id) => {
    if (confirm('Are you sure you want to archive this project?')) {
      try {
        await API.put(`/projects/${id}/archive`);
        fetchData();
      } catch (error) {
        alert('Failed to archive project');
      }
    }
  };

  const handleDeleteProject = async (id) => {
    if (confirm('Are you sure you want to permanently delete this project?')) {
      try {
        await API.delete(`/projects/${id}`);
        fetchData();
      } catch (error) {
        alert('Failed to delete project');
      }
    }
  };

  const toggleTeamMember = (devId) => {
    setProjTeam(prev =>
      prev.includes(devId) ? prev.filter(id => id !== devId) : [...prev, devId]
    );
  };

  const handleRemoveTeamMember = async (project, devId) => {
    const updatedTeam = project.assignedTeam
      .map(d => d._id)
      .filter(id => id !== devId);
      
    try {
      await API.put(`/projects/${project._id}`, {
        assignedTeam: updatedTeam
      });
      fetchData();
    } catch (error) {
      alert('Failed to remove developer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddTeamMember = async (project, devId) => {
    const updatedTeam = [...project.assignedTeam.map(d => d._id), devId];
      
    try {
      await API.put(`/projects/${project._id}`, {
        assignedTeam: updatedTeam
      });
      fetchData();
    } catch (error) {
      alert('Failed to assign developer: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Sprint Operations ---
  const handleOpenSprintModal = (projectId) => {
    setSelectedProjectId(projectId);
    setSprintName('');
    setSprintGoal('');
    setSprintStart('');
    setSprintEnd('');
    setSprintStatus('Upcoming');
    setShowSprintModal(true);
  };

  const handleSaveSprint = async (e) => {
    e.preventDefault();
    const payload = {
      project: selectedProjectId,
      name: sprintName,
      goal: sprintGoal,
      startDate: sprintStart,
      endDate: sprintEnd,
      status: sprintStatus,
    };

    try {
      await API.post('/sprints', payload);
      setShowSprintModal(false);
      fetchData(); // reload projects to reflect changes if necessary
    } catch (error) {
      alert('Error creating sprint: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading project catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-left">Projects Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1 text-left">
            Overview of active client collaborations, assigned teams, budgets, and milestone sprints.
          </p>
        </div>
        {(isAdmin || isClient) && (
          <button
            onClick={() => handleOpenProjectModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-medium flex items-center justify-center gap-2 text-sm active:translate-y-px transition-all shrink-0"
          >
            <Plus size={16} />
            <span>{isClient ? 'Request Project' : 'Create Project'}</span>
          </button>
        )}
      </div>

      {/* Grid List */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-xl">
          <Briefcase size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No projects currently available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="glass-panel p-6 space-y-5 flex flex-col relative group">
              {/* Card Title & Description */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 text-left">{project.name}</h3>
                  <p className="text-xs text-indigo-400 mt-1 text-left">Client: {project.client?.name || 'Unknown Client'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {project.status}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    project.priority === 'Critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                    project.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}>
                    {project.priority}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed text-left flex-1">{project.description}</p>

              {/* Specs block */}
              <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-slate-900/60 text-slate-400 text-[11px]">
                <div className="flex items-center gap-1.5 justify-start">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>Start: {new Date(project.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-start">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>End: {new Date(project.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-start">
                  <DollarSign size={13} className="text-indigo-400" />
                  <span>Budget: ${project.budget.toLocaleString()}</span>
                </div>
              </div>

              {/* Members */}
              <div className="flex flex-col gap-4 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.assignedTeam.slice(0, 3).map((dev, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300"
                          title={dev.name}
                        >
                          {dev.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      ))}
                      {project.assignedTeam.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{project.assignedTeam.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">Team Size: {project.assignedTeam.length} devs</span>
                  </div>

                  {/* CRUD action panel */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenSprintModal(project._id)}
                        className="px-2 py-1 text-[9px] font-semibold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded transition-all flex items-center gap-1"
                        title="Add Sprint"
                      >
                        <Target size={10} />
                        <span>Add Sprint</span>
                      </button>
                      <button
                        onClick={() => handleOpenProjectModal(project)}
                        className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-all"
                        title="Edit Project"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleArchiveProject(project._id)}
                        className="p-1 bg-slate-900 hover:bg-slate-800/80 text-slate-400 hover:text-amber-400 border border-slate-800 rounded transition-all"
                        title="Archive Project"
                      >
                        <Archive size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="p-1 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin Inline Developer Management */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-900/60 text-left space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Project Team settings</span>
                    
                    {/* List current members with remove X */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.assignedTeam.map((dev) => (
                        <span
                          key={dev._id}
                          className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-900 rounded px-2 py-1 text-[10px] text-slate-300 font-medium"
                        >
                          <span>{dev.name}</span>
                          <button
                            onClick={() => handleRemoveTeamMember(project, dev._id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
                            title={`Remove ${dev.name} from project`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {project.assignedTeam.length === 0 && (
                        <span className="text-[10px] text-slate-650 italic">No developers assigned.</span>
                      )}
                    </div>

                    {/* Add Developer select */}
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTeamMember(project, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-slate-950 border border-slate-900 hover:border-slate-800 transition-colors rounded-lg px-2.5 py-1 text-[10px] text-slate-400 focus:outline-none"
                      >
                        <option value="">+ Assign Developer</option>
                        {developers
                          .filter(dev => !project.assignedTeam.some(member => member._id === dev._id))
                          .map(dev => (
                            <option key={dev._id} value={dev._id}>
                              {dev.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE / EDIT PROJECT MODAL --- */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectModal(false)}></div>
          <div className="glass-panel w-full max-w-lg bg-slate-950 p-6 z-10 space-y-6 max-h-[90vh] overflow-y-auto relative animate-slide-up">
            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded-lg bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">{editingProject ? 'Edit Project Details' : 'Create New Project'}</h3>
              <p className="text-xs text-slate-500 mt-1">Fill out the metadata parameters representing this project execution.</p>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Project Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Apollo Portal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Client</label>
                  {isClient ? (
                    <input
                      type="text"
                      disabled
                      value={user.name}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 focus:outline-none disabled:opacity-75"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <select
                        required
                        value={projClient}
                        onChange={(e) => setProjClient(e.target.value)}
                        className="min-w-0 flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                      >
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={handleOpenClientModal}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg transition-all"
                        title="Add Client"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                    placeholder="Budget sum"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  required
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none resize-none"
                  placeholder="Describe goal criteria, timeline parameters..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projStart}
                    onChange={(e) => setProjStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={projEnd}
                    onChange={(e) => setProjEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={projPriority}
                    onChange={(e) => setProjPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  {isClient ? (
                    <input
                      type="text"
                      disabled
                      value="Planning"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-450 focus:outline-none disabled:opacity-75"
                    />
                  ) : (
                    <select
                      value={projStatus}
                      onChange={(e) => setProjStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Devs selection */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Assign Developers Team</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                    {developers.map((dev) => (
                      <button
                        key={dev._id}
                        type="button"
                        onClick={() => toggleTeamMember(dev._id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium text-left border transition-all flex items-center justify-between ${
                          projTeam.includes(dev._id)
                            ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <span>{dev.name}</span>
                        {projTeam.includes(dev._id) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm shadow-md shadow-indigo-600/10 font-semibold"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK ADD CLIENT MODAL --- */}
      {showClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowClientModal(false)}></div>
          <div className="glass-panel w-full max-w-md bg-slate-950 p-6 z-10 space-y-6 relative animate-slide-up">
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded bg-slate-950"
              title="Close"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">Add Client</h3>
              <p className="text-xs text-slate-500 mt-1">Create a client login and attach it to this project.</p>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-left">
              {clientError && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                  <AlertCircle size={15} />
                  <span>{clientError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Client Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Users size={15} />
                  </span>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
                    placeholder="e.g. Acme Operations"
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
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
                    placeholder="client@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Temporary Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <KeyRound size={15} />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE SPRINT MODAL --- */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSprintModal(false)}></div>
          <div className="glass-panel w-full max-w-md bg-slate-950 p-6 z-10 space-y-6 relative animate-slide-up">
            <button
              onClick={() => setShowSprintModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">Create Project Sprint</h3>
              <p className="text-xs text-slate-500 mt-1">Establish milestones and goals for the sprint window.</p>
            </div>

            <form onSubmit={handleSaveSprint} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  placeholder="e.g. Sprint 2: UI Board"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Sprint Goal</label>
                <textarea
                  required
                  rows={2}
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 resize-none"
                  placeholder="Describe sprint milestone target goals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={sprintEnd}
                    onChange={(e) => setSprintEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Initial Status</label>
                <select
                  value={sprintStatus}
                  onChange={(e) => setSprintStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSprintModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Add Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
