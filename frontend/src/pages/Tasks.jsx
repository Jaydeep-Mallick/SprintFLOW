import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  ChevronRight,
  Send,
  X,
  CornerDownRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterProject, setFilterProject] = useState('');
  const [filterSprint, setFilterSprint] = useState('');
  const [filterDeveloper, setFilterDeveloper] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Detail modal
  const [editingTask, setEditingTask] = useState(null); // Edit modal form

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProj, setTaskProj] = useState('');
  const [taskSprint, setTaskSprint] = useState('');
  const [taskDev, setTaskDev] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Backlog');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskEstHours, setTaskEstHours] = useState('');
  const [taskActHours, setTaskActHours] = useState('');

  // Detail Modal Discussion / Comments State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [taskLogs, setTaskLogs] = useState([]);

  const isAdmin = user.role === 'Admin';
  const isDeveloper = user.role === 'Developer';

  // Kanban Columns
  const COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Testing', 'Review', 'Done'];

  const fetchFilters = async () => {
    try {
      const projRes = await API.get('/projects');
      setProjects(projRes.data);

      const devRes = await API.get('/users/developers');
      setDevelopers(devRes.data);
    } catch (err) {
      console.error('Error fetching filters data:', err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Build query string
      let queryParams = [];
      if (filterProject) queryParams.push(`project=${filterProject}`);
      if (filterSprint) queryParams.push(`sprint=${filterSprint}`);
      if (filterDeveloper) queryParams.push(`assignedDeveloper=${filterDeveloper}`);
      if (filterPriority) queryParams.push(`priority=${filterPriority}`);

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await API.get(`/tasks${queryStr}`);
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchTasks();
    if (filterProject) {
      // Load sprints for selected project
      API.get(`/sprints/project/${filterProject}`)
        .then(res => setSprints(res.data))
        .catch(err => console.error('Failed to load project sprints:', err));
    } else {
      setSprints([]);
      setFilterSprint('');
    }
  }, [filterProject, filterSprint, filterDeveloper, filterPriority]);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenTaskModal();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- Task Detail & Comments loading ---
  const handleOpenDetail = async (task) => {
    setSelectedTask(task);
    try {
      const commentsRes = await API.get(`/comments/task/${task._id}`);
      setComments(commentsRes.data);
      
      // Also fetch activity logs for this task
      const logsRes = await API.get(`/projects`); // we can filter project activity logs in frontend or fetch specific
      // We will mock logs or load a simplified list
    } catch (err) {
      console.error('Failed to load comments details:', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await API.post('/comments', {
        task: selectedTask._id,
        content: newComment
      });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      
      // Refresh task detail to show log if necessary
      handleOpenDetail(selectedTask);
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handlePostReply = async (commentId) => {
    if (!replyContent.trim()) return;
    try {
      const res = await API.post(`/comments/${commentId}/reply`, {
        content: replyContent
      });
      setComments(prev =>
        prev.map(c => c._id === commentId ? res.data : c)
      );
      setReplyToId(null);
      setReplyContent('');
    } catch (err) {
      alert('Failed to reply');
    }
  };

  // --- HTML5 Drag and Drop handlers ---
  const onDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Find the task locally and check if status is actually changing
    const taskObj = tasks.find(t => t._id === taskId);
    if (!taskObj || taskObj.status === newStatus) return;

    // Optimistic UI updates
    setTasks(prev =>
      prev.map(t => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks(); // Reload to sync with database audit logs
    } catch (error) {
      alert('Unauthorized to update task status: ' + (error.response?.data?.message || error.message));
      fetchTasks(); // Rollback local state
    }
  };

  // --- Task Creator / Editor Modal handlers ---
  const handleOpenTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskProj(task.project?._id || '');
      setTaskSprint(task.sprint?._id || '');
      setTaskDev(task.assignedDeveloper?._id || '');
      setTaskPriority(task.priority);
      setTaskStatus(task.status);
      setTaskDeadline(task.deadline.split('T')[0]);
      setTaskEstHours(task.estimatedHours);
      setTaskActHours(task.actualHours);
    } else {
      setEditingTask(null);
      setTaskTitle('');
      setTaskDesc('');
      setTaskProj(filterProject);
      setTaskSprint(filterSprint);
      setTaskDev('');
      setTaskPriority('Medium');
      setTaskStatus('Backlog');
      setTaskDeadline('');
      setTaskEstHours('');
      setTaskActHours(0);
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const payload = {
      title: taskTitle,
      description: taskDesc,
      project: taskProj,
      sprint: taskSprint || null,
      assignedDeveloper: taskDev || null,
      priority: taskPriority,
      status: taskStatus,
      deadline: taskDeadline,
      estimatedHours: Number(taskEstHours),
      actualHours: Number(taskActHours)
    };

    try {
      if (editingTask) {
        await API.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await API.post('/tasks', payload);
      }
      setShowTaskModal(false);
      fetchTasks();
    } catch (error) {
      alert('Error saving task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Are you sure you want to permanently delete this task?')) {
      try {
        await API.delete(`/tasks/${id}`);
        setSelectedTask(null);
        fetchTasks();
      } catch (err) {
        alert('Failed to delete task');
      }
    }
  };

  // Filter Tasks list based on text search
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col overflow-hidden animate-fade-in relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-left">Kanban Sprint Board</h1>
          <p className="text-sm text-slate-400 mt-1 text-left">
            Drag cards across columns to advance task status. Double click cards to collaborate.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenTaskModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-medium flex items-center justify-center gap-2 text-sm transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Filters and Search toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Project selector */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          {/* Sprint selector (depends on project) */}
          <select
            value={filterSprint}
            disabled={!filterProject}
            onChange={(e) => setFilterSprint(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none disabled:opacity-40"
          >
            <option value="">All Sprints</option>
            {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          {/* Developer selector */}
          <select
            value={filterDeveloper}
            onChange={(e) => setFilterDeveloper(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Assignees</option>
            {developers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          {/* Priority selector */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Text Search */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            placeholder="Search tasks..."
          />
        </div>
      </div>

      {/* --- KANBAN BOARD CONTAINER --- */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-[1200px] items-stretch">
            {COLUMNS.map((colName) => {
              const colTasks = filteredTasks.filter(t => t.status === colName);
              return (
                <div
                  key={colName}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, colName)}
                  className="w-80 bg-slate-950/40 border border-slate-900/60 rounded-xl flex flex-col p-4 space-y-3 scroll-container group/col hover:border-slate-800/80 transition-colors"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{colName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-850 text-slate-500">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column Tasks */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {colTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onClick={() => handleOpenDetail(task)}
                        className="glass-panel p-4 bg-slate-900/40 border border-slate-850/80 cursor-grab active:cursor-grabbing hover:bg-slate-900 hover:border-slate-700/50 transition-all select-none relative group/card space-y-3.5 shadow-md shadow-black/5"
                      >
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-bold text-indigo-400/80 tracking-wide block uppercase">
                            {task.project?.name.substring(0, 16)}...
                          </span>
                          <h4 className="text-xs font-bold text-slate-200 group-hover/card:text-white transition-colors">
                            {task.title}
                          </h4>
                        </div>

                        {/* Specs row */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-950">
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{task.estimatedHours}h</span>
                          </div>
                          <span className={`badge-priority-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Bottom Row: Dev initials & due date */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] text-slate-600 flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>

                          <div
                            className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-400"
                            title={task.assignedDeveloper?.name || 'Unassigned'}
                          >
                            {task.assignedDeveloper ? task.assignedDeveloper.name.split(' ').map(n => n[0]).join('') : '?'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-24 border border-dashed border-slate-900/60 rounded-xl flex items-center justify-center text-slate-600 text-[10px]">
                        Empty Column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- TASK DETAIL VIEW MODAL (SIDEBAR SLIDEOUT) --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}></div>
          <div className="glass-panel w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full z-10 flex flex-col relative animate-slide-left p-0">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-900/80 flex justify-between items-start gap-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">
                  {selectedTask.project?.name}
                </span>
                <h2 className="text-lg font-bold text-white leading-tight">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded-lg bg-slate-950"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Details Specs Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/30 border border-slate-900 rounded-lg text-xs text-slate-400 text-left">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                  <span className="text-slate-200 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 inline-block font-semibold">
                    {selectedTask.status}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Priority</span>
                  <span className={`badge-priority-${selectedTask.priority.toLowerCase()} inline-block`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Developer Assignee</span>
                  <span className="text-slate-200 font-medium">
                    {selectedTask.assignedDeveloper?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Deadline</span>
                  <span className="text-slate-200 font-medium">
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Time</span>
                  <span className="text-slate-200 font-medium">{selectedTask.estimatedHours} hours</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Actual Logged</span>
                  <span className="text-slate-200 font-medium">{selectedTask.actualHours} hours</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 border border-slate-900 p-4 rounded-lg">
                  {selectedTask.description}
                </p>
              </div>

              {/* Comments / Collaboration discussion */}
              <div className="space-y-4 border-t border-slate-900/80 pt-5 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collaboration Chat</h4>
                
                {/* Comments feed */}
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[11px] text-slate-600 py-3">No comments yet. Start the discussion below.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="space-y-2">
                        <div className="p-3 bg-slate-900 border border-slate-900 rounded-lg space-y-1.5 relative">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300">{comment.author?.name} ({comment.author?.role})</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300">{comment.content}</p>
                          <button
                            onClick={() => setReplyToId(comment._id)}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Nesting Replies */}
                        {comment.replies && comment.replies.map((reply, rid) => (
                          <div key={rid} className="pl-6 flex gap-2 items-start">
                            <CornerDownRight size={14} className="text-slate-700 mt-1 shrink-0" />
                            <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex-1 text-left space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-500">
                                <span className="font-semibold text-slate-400">{reply.author?.name}</span>
                                <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-300">{reply.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Reply Input Form */}
                        {replyToId === comment._id && (
                          <div className="pl-6 flex gap-2">
                            <input
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                            />
                            <button
                              onClick={() => handlePostReply(comment._id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold"
                            >
                              Reply
                            </button>
                            <button onClick={() => setReplyToId(null)} className="text-xs text-slate-500 hover:underline">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Posting form */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or log work notes..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-slate-900/80 bg-slate-950/60 flex justify-between gap-3 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => handleDeleteTask(selectedTask._id)}
                  className="px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold"
                >
                  Delete Task
                </button>
              )}
              <div className="flex gap-2.5 ml-auto">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                {(isAdmin || (isDeveloper && selectedTask.assignedDeveloper?._id === user._id)) && (
                  <button
                    onClick={() => {
                      handleOpenTaskModal(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Edit Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT TASK MODAL --- */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTaskModal(false)}></div>
          <div className="glass-panel w-full max-w-lg bg-slate-950 p-6 z-10 space-y-6 max-h-[90vh] overflow-y-auto relative animate-slide-up">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border border-slate-900 p-1.5 rounded-lg bg-slate-950"
            >
              <X size={16} />
            </button>
            <div className="border-b border-slate-900 pb-3 text-left">
              <h3 className="text-xl font-bold text-white">{editingTask ? 'Edit Task Specifications' : 'Create New Sprint Task'}</h3>
              <p className="text-xs text-slate-500 mt-1">Configure metrics, developers, sprints, and priorities.</p>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  disabled={isDeveloper}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 disabled:opacity-50"
                  placeholder="e.g. Implement login route"
                />
              </div>

              {!isDeveloper && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Project</label>
                    <select
                      required
                      value={taskProj}
                      onChange={(e) => setTaskProj(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Sprint</label>
                    <select
                      value={taskSprint}
                      onChange={(e) => setTaskSprint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="">Backlog (No Sprint)</option>
                      {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!isDeveloper && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Developer Assignee</label>
                    <select
                      value={taskDev}
                      onChange={(e) => setTaskDev(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="">Unassigned</option>
                      {developers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                  >
                    {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              </div>

              {!isDeveloper && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 resize-none"
                    placeholder="Provide developer execution parameters..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!isDeveloper && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Deadline</label>
                    <input
                      type="date"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    />
                  </div>
                )}
                {!isDeveloper && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Est. Hours</label>
                    <input
                      type="number"
                      required
                      value={taskEstHours}
                      onChange={(e) => setTaskEstHours(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      placeholder="Hours estimation"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isDeveloper && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Actual Logged Hours</label>
                  <input
                    type="number"
                    value={taskActHours}
                    onChange={(e) => setTaskActHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    placeholder="Work hours done"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
