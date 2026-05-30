import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import {
  FolderKanban,
  Users,
  Compass,
  CheckSquare,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/analytics/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Compiling dashboard analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-slate-500 text-center py-12">Failed to load dashboard data.</div>;

  const role = user.role;

  // Chart Colors System
  const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#64748b'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-slate-200">{user.name}</span>. Here is a summary of your workspace activities.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-400">
          <Clock size={14} className="text-indigo-400" />
          <span>Local Time: {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* --- ADMIN DASHBOARD --- */}
      {/* ======================================================== */}
      {role === 'Admin' && (
        <div className="space-y-8 text-left">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Total Projects" value={data.stats.totalProjects} icon={FolderKanban} colorClass="text-blue-400" />
            <StatCard title="Active Sprints" value={data.stats.activeSprints} icon={Compass} colorClass="text-indigo-400" />
            <StatCard title="Open Support Tickets" value={data.stats.openTickets} icon={HelpCircle} colorClass="text-amber-400" />
            <StatCard title="Overdue Tasks" value={data.stats.overdueTasks} icon={AlertCircle} colorClass="text-rose-400 animate-pulse" />
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel p-5 space-y-3.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Quick Actions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/projects', { state: { openCreateModal: true } })}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md shadow-indigo-600/10 active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Plus size={14} />
                <span>+ Create Project</span>
              </button>
              <button
                onClick={() => navigate('/tasks', { state: { openCreateModal: true } })}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Plus size={14} className="text-indigo-400" />
                <span>+ Create Sprint Task</span>
              </button>
              <button
                onClick={() => navigate('/users', { state: { openCreateModal: true } })}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Plus size={14} className="text-emerald-400" />
                <span>+ Add User Account</span>
              </button>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Status Chart */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Tasks Status Breakdown</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.charts.tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Completion Chart */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Project Completion Rates</h3>
              <div className="h-72 flex items-center justify-center">
                {data.charts.projectCompletion.length === 0 ? (
                  <span className="text-xs text-slate-500">No active projects logged.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.projectCompletion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} suffix="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#cbd5e1' }}
                      />
                      <Bar dataKey="rate" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                        {data.charts.projectCompletion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate === 100 ? '#10b981' : '#4f46e5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Developer Hours logged */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Team Logged Hours worked</h3>
              <div className="h-72 flex items-center justify-center">
                {data.charts.developerProductivity.length === 0 ? (
                  <span className="text-xs text-slate-500">No work hours logged yet.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.developerProductivity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#cbd5e1' }}
                      />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Sprint Completion Chart */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Sprints Analytics Progress</h3>
              <div className="h-72 flex items-center justify-center">
                {data.charts.sprintProgress.length === 0 ? (
                  <span className="text-xs text-slate-500">No active sprints logged.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.sprintProgress}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} suffix="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#cbd5e1' }}
                      />
                      <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- DEVELOPER DASHBOARD --- */}
      {/* ======================================================== */}
      {role === 'Developer' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Assigned Tasks" value={data.stats.assignedTasks} icon={Layers} colorClass="text-blue-400" />
            <StatCard title="Completed Tasks" value={data.stats.completedTasks} icon={CheckSquare} colorClass="text-emerald-400" />
            <StatCard title="Pending Tasks" value={data.stats.pendingTasks} icon={AlertCircle} colorClass="text-amber-400" />
            <StatCard title="Weekly Hours Logged" value={`${data.stats.weeklyHours} hrs`} icon={Clock} colorClass="text-indigo-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Sprint Widget */}
            <div className="glass-panel p-6 space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Current Sprint</h3>
              {data.stats.activeSprint ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {data.stats.activeSprint.project}
                    </span>
                    <h4 className="text-lg font-bold text-slate-100 mt-0.5">{data.stats.activeSprint.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal</span>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/30 p-3 border border-slate-800 rounded">
                      {data.stats.activeSprint.goal}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500">No active sprint for your projects.</p>
                </div>
              )}
            </div>

            {/* Tasks list */}
            <div className="glass-panel p-6 space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">My Assigned Tasks</h3>
              <div className="overflow-x-auto">
                {data.tasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">No tasks currently assigned to you.</div>
                ) : (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                        <th className="pb-3">Task Title</th>
                        <th className="pb-3">Project</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {data.tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-slate-900/20 transition-all">
                          <td className="py-3 font-semibold text-slate-200">{task.title}</td>
                          <td className="py-3 text-slate-400">{task.project?.name}</td>
                          <td className="py-3">
                            <span className={`badge-priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{new Date(task.deadline).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- CLIENT DASHBOARD --- */}
      {/* ======================================================== */}
      {role === 'Client' && (
        <div className="space-y-8 animate-fade-in text-left">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Total Projects" value={data.stats.totalProjects} icon={FolderKanban} colorClass="text-blue-400" />
            <StatCard title="Active Projects" value={data.stats.activeProjects} icon={Compass} colorClass="text-indigo-400" />
            <StatCard title="Open Support Tickets" value={data.stats.openTickets} icon={HelpCircle} colorClass="text-amber-400" />
            <StatCard title="Task Progress" value={`${data.stats.completedTasks}/${data.stats.totalTasks}`} icon={CheckSquare} colorClass="text-emerald-400" />
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel p-5 space-y-3.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Client Quick Actions</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/projects', { state: { openCreateModal: true } })}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md shadow-indigo-600/10 active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Plus size={14} />
                <span>+ Create Project</span>
              </button>
              <button
                onClick={() => navigate('/tickets', { state: { openCreateModal: true } })}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Plus size={14} className="text-amber-400" />
                <span>+ Raise Support Ticket</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects Overview */}
            <div className="glass-panel p-6 space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">My Projects Progress</h3>
              <div className="space-y-4">
                {data.projects.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No projects assigned.</p>
                ) : (
                  data.projects.map((proj) => (
                    <div key={proj._id} className="p-4 bg-slate-950 border border-slate-900 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-200">{proj.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{proj.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold">
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-900/60">
                        <span>Timeline: {new Date(proj.startDate).toLocaleDateString()} - {new Date(proj.endDate).toLocaleDateString()}</span>
                        <span>Priority: <span className="font-semibold text-slate-300">{proj.priority}</span></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sprints status */}
            <div className="glass-panel p-6 space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Sprint Telemetry</h3>
              <div className="space-y-4">
                {data.sprints.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500">No active sprints found.</p>
                  </div>
                ) : (
                  data.sprints.map((spr, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 border border-slate-900 rounded-lg space-y-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block">{spr.project}</span>
                      <h4 className="font-bold text-slate-200">{spr.name}</h4>
                      
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Completion</span>
                          <span className="font-bold text-slate-200">{spr.completion}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${spr.completion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
