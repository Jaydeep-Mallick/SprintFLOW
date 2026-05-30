import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { FileText, Download, Printer, Filter, ChevronRight, BarChart3, Clock, CheckSquare } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('project'); // 'project' | 'sprint' | 'developer' | 'timesheet'
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  
  // Selector inputs
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');

  const fetchFilters = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch filter items:', err.message);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedProjectId && reportType === 'sprint') {
      API.get(`/sprints/project/${selectedProjectId}`)
        .then(res => setSprints(res.data))
        .catch(err => console.error('Failed to load project sprints:', err));
    } else {
      setSprints([]);
      setSelectedSprintId('');
    }
  }, [selectedProjectId, reportType]);

  const generateReport = async () => {
    setLoading(true);
    setPreviewData([]);
    try {
      if (reportType === 'project') {
        // Generate Project report (Tasks details, hours, statuses)
        if (!selectedProjectId) return alert('Please select a project first');
        
        const tasksRes = await API.get(`/tasks?project=${selectedProjectId}`);
        const projRes = await API.get(`/projects/${selectedProjectId}`);
        
        const summary = {
          name: projRes.data.name,
          budget: projRes.data.budget,
          client: projRes.data.client?.name,
          status: projRes.data.status,
          totalTasks: tasksRes.data.length,
          completedTasks: tasksRes.data.filter(t => t.status === 'Done').length,
          estimatedHours: tasksRes.data.reduce((sum, t) => sum + t.estimatedHours, 0),
          actualHours: tasksRes.data.reduce((sum, t) => sum + t.actualHours, 0),
          tasks: tasksRes.data.map(t => ({
            title: t.title,
            priority: t.priority,
            status: t.status,
            assignee: t.assignedDeveloper?.name || 'Unassigned',
            hours: `${t.actualHours}/${t.estimatedHours} hrs`
          }))
        };
        setPreviewData(summary);
      } 
      
      else if (reportType === 'sprint') {
        if (!selectedSprintId) return alert('Please select a sprint first');
        const res = await API.get(`/sprints/${selectedSprintId}/analytics`);
        const tasksRes = await API.get(`/tasks?sprint=${selectedSprintId}`);
        
        setPreviewData({
          name: res.data.name,
          status: res.data.status,
          completion: res.data.completionPercentage,
          totalTasks: res.data.totalTasks,
          completedTasks: res.data.completedTasks,
          estimated: res.data.hours.estimated,
          actual: res.data.hours.actual,
          tasks: tasksRes.data.map(t => ({
            title: t.title,
            priority: t.priority,
            status: t.status,
            assignee: t.assignedDeveloper?.name || 'Unassigned'
          }))
        });
      } 
      
      else if (reportType === 'developer') {
        // Developer productivity: query timesheets summary
        const res = await API.get('/timesheets/admin/summary');
        const list = Object.keys(res.data.devProductivity).map(name => ({
          developer: name,
          totalHours: res.data.devProductivity[name],
          avgNotesLength: 'Logged active timesheets'
        }));
        setPreviewData(list);
      } 
      
      else if (reportType === 'timesheet') {
        const res = await API.get('/timesheets/admin/summary');
        const list = res.data.timesheets.map(t => ({
          date: new Date(t.date).toLocaleDateString(),
          developer: t.developer?.name || 'Unknown',
          project: t.project?.name || 'Unknown',
          task: t.task?.title || 'Unknown',
          hours: t.hoursWorked,
          notes: t.notes
        }));
        setPreviewData(list);
      }
    } catch (err) {
      console.error('Failed to generate report details:', err);
      alert('Error compiling report details');
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Export Helper (Excel compatible) ---
  const handleExportCSV = () => {
    if (!previewData || Object.keys(previewData).length === 0) {
      return alert('No report data generated to export');
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'project' || reportType === 'sprint') {
      csvContent += `Report,${previewData.name}\n`;
      csvContent += `Status,${previewData.status}\n`;
      csvContent += `Completed Tasks,${previewData.completedTasks}/${previewData.totalTasks}\n\n`;
      csvContent += "Task Title,Priority,Status,Assignee,Logged Hours\n";
      
      previewData.tasks.forEach(t => {
        csvContent += `"${t.title}",${t.priority},${t.status},"${t.assignee}",${t.hours || ''}\n`;
      });
    } 
    
    else if (reportType === 'developer') {
      csvContent += "Developer Name,Total Hours Logged\n";
      previewData.forEach(d => {
        csvContent += `"${d.developer}",${d.totalHours}\n`;
      });
    } 
    
    else if (reportType === 'timesheet') {
      csvContent += "Date,Developer,Project,Task Title,Hours Logged,Notes\n";
      previewData.forEach(t => {
        csvContent += `${t.date},"${t.developer}","{t.project}","${t.task}",${t.hours},"${t.notes.replace(/"/g, '""')}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SprintFlow_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-left">Reports Center</h1>
          <p className="text-sm text-slate-400 mt-1 text-left font-sans">
            Generate project, sprint, developer productivity, and timesheet reports. Export to Excel or PDF.
          </p>
        </div>
      </div>

      {/* Select Report configuration bar */}
      <div className="glass-panel p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end no-print text-left">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Report Category</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setPreviewData([]);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
          >
            <option value="project">Project Tasks & Budgets</option>
            <option value="sprint">Sprint Completion & Burndown</option>
            <option value="developer">Developer Productivity Totals</option>
            <option value="timesheet">Raw Timesheet Exports</option>
          </select>
        </div>

        {/* Dynamic Project filter */}
        {(reportType === 'project' || reportType === 'sprint') && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Select Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
            >
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Dynamic Sprint filter */}
        {reportType === 'sprint' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Select Sprint</label>
            <select
              disabled={!selectedProjectId}
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 disabled:opacity-40"
            >
              <option value="">Select Sprint</option>
              {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="sm:col-start-4">
          <button
            onClick={generateReport}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition-all"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* --- REPORT PREVIEW CONTAINER --- */}
      {previewData && Object.keys(previewData).length > 0 && (
        <div className="space-y-6">
          
          {/* Action Toolbar */}
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download size={14} className="text-indigo-400" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Printer size={14} className="text-indigo-400" />
              <span>Print / PDF</span>
            </button>
          </div>

          {/* Formatted Report sheet */}
          <div className="glass-panel p-8 bg-slate-950/40 relative text-left">
            <div className="border-b border-slate-900 pb-5 mb-6 flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">SprintFlow Report Sheets</span>
                <h2 className="text-2xl font-black text-white capitalize">{reportType} Audit Ledger</h2>
                <p className="text-xs text-slate-500">Date Generated: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-sm text-indigo-500 tracking-wider">SPRINTFLOW PLATFORM</span>
              </div>
            </div>

            {/* --- Project Report preview layout --- */}
            {reportType === 'project' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/20 border border-slate-900 rounded-lg text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Project Name</span>
                    <span className="text-slate-200 font-semibold">{previewData.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Client Client</span>
                    <span className="text-slate-200 font-semibold">{previewData.client}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Budget Total</span>
                    <span className="text-slate-200 font-semibold">${previewData.budget?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hours Logged</span>
                    <span className="text-slate-200 font-semibold">{previewData.actualHours} hrs / {previewData.estimatedHours} hrs</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated Tasks</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                          <th className="pb-2">Task</th>
                          <th className="pb-2">Priority</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Assignee</th>
                          <th className="pb-2">Logged vs Est. Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        {previewData.tasks.map((task, tid) => (
                          <tr key={tid}>
                            <td className="py-2.5 font-medium text-slate-200">{task.title}</td>
                            <td className="py-2.5">{task.priority}</td>
                            <td className="py-2.5">{task.status}</td>
                            <td className="py-2.5">{task.assignee}</td>
                            <td className="py-2.5 text-slate-300">{task.hours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- Sprint Report preview layout --- */}
            {reportType === 'sprint' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/20 border border-slate-900 rounded-lg text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Sprint Name</span>
                    <span className="text-slate-200 font-semibold">{previewData.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Sprint Status</span>
                    <span className="text-slate-200 font-semibold">{previewData.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Completion %</span>
                    <span className="text-slate-200 font-semibold">{previewData.completion}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hours Logged</span>
                    <span className="text-slate-200 font-semibold">{previewData.actual} hrs / {previewData.estimated} hrs</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated Tasks</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                          <th className="pb-2">Task</th>
                          <th className="pb-2">Priority</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Assignee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        {previewData.tasks.map((task, tid) => (
                          <tr key={tid}>
                            <td className="py-2.5 font-medium text-slate-200">{task.title}</td>
                            <td className="py-2.5">{task.priority}</td>
                            <td className="py-2.5">{task.status}</td>
                            <td className="py-2.5">{task.assignee}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- Developer Report preview layout --- */}
            {reportType === 'developer' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                      <th className="pb-2">Developer Assignee</th>
                      <th className="pb-2">Hours Logged</th>
                      <th className="pb-2">Activity Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {previewData.map((d, id) => (
                      <tr key={id}>
                        <td className="py-3 font-semibold text-slate-200">{d.developer}</td>
                        <td className="py-3 text-indigo-400 font-bold">{d.totalHours} hrs</td>
                        <td className="py-3 text-slate-400">{d.avgNotesLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Timesheets Report preview layout --- */}
            {reportType === 'timesheet' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Developer</th>
                      <th className="pb-2">Project</th>
                      <th className="pb-2">Task</th>
                      <th className="pb-2">Hours</th>
                      <th className="pb-2">Work Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {previewData.map((t, tid) => (
                      <tr key={tid}>
                        <td className="py-2.5 text-slate-500">{t.date}</td>
                        <td className="py-2.5 font-medium text-slate-200">{t.developer}</td>
                        <td className="py-2.5 text-slate-400">{t.project}</td>
                        <td className="py-2.5 text-slate-400">{t.task}</td>
                        <td className="py-2.5 font-bold text-indigo-400">{t.hours} hrs</td>
                        <td className="py-2.5 text-slate-300 max-w-xs truncate" title={t.notes}>{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Empty Preview state */}
      {(!previewData || Object.keys(previewData).length === 0) && (
        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl no-print">
          <FileText size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">Select report metrics configuration options and click "Generate Report".</p>
        </div>
      )}

    </div>
  );
};

export default Reports;
