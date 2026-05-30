import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { Clock, Plus, Filter, Calendar, Folder, FileText, CheckCircle } from 'lucide-react';

const Timesheets = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Log Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logProject, setLogProject] = useState('');
  const [logTask, setLogTask] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Admin Tab State
  const [adminTab, setAdminTab] = useState('raw-logs'); // 'raw-logs' | 'aggregates'

  const isDeveloper = user.role === 'Developer';
  const isAdmin = user.role === 'Admin';

  const fetchTimesheetData = async () => {
    try {
      setLoading(true);
      if (isDeveloper) {
        const res = await API.get('/timesheets/my');
        setLogs(res.data);
        
        const projRes = await API.get('/projects');
        setProjects(projRes.data);
      } else if (isAdmin) {
        const res = await API.get('/timesheets/admin/summary');
        setLogs(res.data.timesheets);
        setSummaryData({
          devProductivity: res.data.devProductivity,
          projectHours: res.data.projectHours
        });
      }
    } catch (err) {
      console.error('Error fetching timesheet telemetry:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheetData();
  }, []);

  // Fetch tasks when project is selected in time log form
  useEffect(() => {
    if (logProject) {
      API.get(`/tasks?project=${logProject}`)
        .then(res => {
          // Dev can only log hours on tasks assigned to them, or we can allow overall project tasks
          // Let's filter to tasks assigned to current developer for precision!
          const devTasks = res.data.filter(t => t.assignedDeveloper?._id === user._id);
          setTasks(devTasks);
        })
        .catch(err => console.error('Failed to fetch tasks for project logging:', err));
    } else {
      setTasks([]);
      setLogTask('');
    }
  }, [logProject]);

  const handleSaveTimesheet = async (e) => {
    e.preventDefault();
    const payload = {
      project: logProject,
      task: logTask,
      hoursWorked: Number(logHours),
      notes: logNotes,
      date: logDate
    };

    try {
      await API.post('/timesheets', payload);
      setShowLogModal(false);
      
      // Clear form
      setLogProject('');
      setLogTask('');
      setLogHours('');
      setLogNotes('');
      setLogDate(new Date().toISOString().split('T')[0]);

      fetchTimesheetData();
    } catch (err) {
      alert('Failed to log work hours: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Retrieving timesheet catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-left">Timesheets & Hours</h1>
          <p className="text-sm text-slate-400 mt-1 text-left">
            {isDeveloper ? 'Log your developer work hours and notes against assigned tasks.' : 'Review overall team productivity and project billable hours.'}
          </p>
        </div>
        {isDeveloper && (
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-medium flex items-center justify-center gap-2 text-sm transition-all shrink-0 animate-fade-in"
          >
            <Plus size={16} />
            <span>Log Work Hours</span>
          </button>
        )}
      </div>

      {/* --- ADMIN VIEW LAYOUT --- */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Tab selectors */}
          <div className="flex border-b border-slate-900 gap-6 text-sm shrink-0 justify-start">
            <button
              onClick={() => setAdminTab('raw-logs')}
              className={`pb-3 font-semibold transition-all border-b-2 ${
                adminTab === 'raw-logs' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Raw Timesheet Logs
            </button>
            <button
              onClick={() => setAdminTab('aggregates')}
              className={`pb-3 font-semibold transition-all border-b-2 ${
                adminTab === 'aggregates' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Productivity Aggregates
            </button>
          </div>

          {adminTab === 'raw-logs' && (
            <div className="glass-panel overflow-hidden p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-left">Logged Timesheets</h3>
              <div className="overflow-x-auto">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No hours logged yet.</p>
                ) : (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                        <th className="pb-3">Developer</th>
                        <th className="pb-3">Project</th>
                        <th className="pb-3">Task Title</th>
                        <th className="pb-3">Hours Logged</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Work Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/65">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-900/10">
                          <td className="py-3.5 font-semibold text-slate-200">{log.developer?.name}</td>
                          <td className="py-3.5 text-slate-400">{log.project?.name}</td>
                          <td className="py-3.5 text-slate-400">{log.task?.title}</td>
                          <td className="py-3.5 font-bold text-indigo-400">{log.hoursWorked} hrs</td>
                          <td className="py-3.5 text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="py-3.5 text-slate-300 max-w-xs truncate" title={log.notes}>{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {adminTab === 'aggregates' && summaryData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project hours aggregate */}
              <div className="glass-panel p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-left">Billable Hours per Project</h3>
                <div className="space-y-3.5">
                  {Object.keys(summaryData.projectHours).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No project logs compiled.</p>
                  ) : (
                    Object.keys(summaryData.projectHours).map((projName, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Folder size={14} className="text-indigo-400" />
                          <span className="font-semibold text-slate-300">{projName}</span>
                        </div>
                        <span className="font-bold text-white bg-indigo-600/10 border border-indigo-500/25 px-2 py-0.5 rounded">
                          {summaryData.projectHours[projName]} hrs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Developer hours aggregate */}
              <div className="glass-panel p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-left">Developer Logged Totals</h3>
                <div className="space-y-3.5">
                  {Object.keys(summaryData.devProductivity).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No developer logs compiled.</p>
                  ) : (
                    Object.keys(summaryData.devProductivity).map((devName, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-emerald-400" />
                          <span className="font-semibold text-slate-300">{devName}</span>
                        </div>
                        <span className="font-bold text-white bg-emerald-600/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {summaryData.devProductivity[devName]} hrs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- DEVELOPER VIEW LAYOUT --- */}
      {isDeveloper && (
        <div className="glass-panel p-6 space-y-4 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-left">My Hours Worked Log</h3>
          <div className="overflow-x-auto">
            {logs.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/30 border border-slate-900 rounded-xl">
                <p className="text-xs text-slate-500">You have not logged any work hours yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Task Title</th>
                    <th className="pb-3">Hours Worked</th>
                    <th className="pb-3">Work Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-3.5 text-slate-400 font-semibold">{log.project?.name}</td>
                      <td className="py-3.5 text-slate-400">{log.task?.title}</td>
                      <td className="py-3.5 font-bold text-indigo-400">{log.hoursWorked} hrs</td>
                      <td className="py-3.5 text-slate-300 max-w-xs truncate" title={log.notes}>{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- LOG HOURS MODAL --- */}
      {showLogModal && isDeveloper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogModal(false)}></div>
          <div className="glass-panel w-full max-w-md bg-slate-950 p-6 z-10 space-y-6 relative animate-slide-up">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded-lg bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">Log Developer Work Hours</h3>
              <p className="text-xs text-slate-500 mt-1">Specify task, hours, and description of work completed.</p>
            </div>

            <form onSubmit={handleSaveTimesheet} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Select Project</label>
                <select
                  required
                  value={logProject}
                  onChange={(e) => setLogProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Select Task</label>
                <select
                  required
                  disabled={!logProject}
                  value={logTask}
                  onChange={(e) => setLogTask(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none disabled:opacity-40"
                >
                  <option value="">Select Assigned Task</option>
                  {tasks.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
                {logProject && tasks.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">No tasks assigned to you on this project.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Hours Logged</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    placeholder="e.g. 4"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Date</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Work Notes</label>
                <textarea
                  required
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 resize-none"
                  placeholder="Detail actions completed, bug logs fixed..."
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!logTask}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Save Time Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
