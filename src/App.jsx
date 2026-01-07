import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Square, 
  Calendar, 
  Tag, 
  Flag, 
  Filter, 
  LayoutList,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const App = () => {
  // ---------------- State Management ----------------
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('zen_todo_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: '整理桌面', category: '生活', priority: 'low', completed: false, createdAt: Date.now() },
      { id: 2, text: '完成项目报告', category: '工作', priority: 'high', completed: false, createdAt: Date.now() },
    ];
  });

  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('工作');
  const [priority, setPriority] = useState('medium');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [filterCategory, setFilterCategory] = useState('all');

  // Persistence
  useEffect(() => {
    localStorage.setItem('zen_todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // ---------------- Helpers ----------------
  const categories = ['工作', '生活', '学习', '健康', '杂项'];
  
  const priorityConfig = {
    high: { label: '高优', color: 'text-red-600 bg-red-50 border-red-200', iconColor: 'text-red-500' },
    medium: { label: '中等', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-500' },
    low: { label: '低优', color: 'text-blue-600 bg-blue-50 border-blue-200', iconColor: 'text-blue-500' },
  };

  // ---------------- Handlers ----------------
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask,
      category,
      priority,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
  };

  // ---------------- Filtering & Sorting Logic ----------------
  // Sort logic: Uncompleted first > Priority (High->Low) > Date (New->Old)
  const priorityOrder = { high: 3, medium: 2, low: 1 };

  const filteredTasks = tasks
    .filter(task => {
      if (filterStatus === 'active') return !task.completed;
      if (filterStatus === 'completed') return task.completed;
      return true;
    })
    .filter(task => {
      if (filterCategory === 'all') return true;
      return task.category === filterCategory;
    })
    .sort((a, b) => {
      // 1. Completed at bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // 2. Priority High to Low
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // 3. Newest first
      return b.createdAt - a.createdAt;
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
  };
  
  const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700 pb-20">
      
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <LayoutList className="w-7 h-7 text-indigo-600" />
                井井有条
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {stats.active === 0 && stats.total > 0 
                  ? "太棒了！所有任务已清空 🎉" 
                  : `你还有 ${stats.active} 个任务待处理`}
              </p>
            </div>
            
            {/* Progress Circle */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                  className={`transition-all duration-500 ease-out ${progress === 100 ? 'text-green-500' : 'text-indigo-600'}`}
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-700">{progress}%</span>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={addTask} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="下一步做什么？"
                  className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="high">高优</option>
                  <option value="medium">中等</option>
                  <option value="low">低优</option>
                </select>

                <button 
                  type="submit"
                  disabled={!newTask.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition-colors flex items-center justify-center shadow-md active:transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sticky top-[165px] z-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-50'}`}
            >
              全部
            </button>
            <button 
              onClick={() => setFilterStatus('active')}
              className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'active' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-50'}`}
            >
              进行中
            </button>
            <button 
              onClick={() => setFilterStatus('completed')}
              className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-50'}`}
            >
              已完成
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <button 
              onClick={() => setFilterCategory('all')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200 hover:border-gray-300'}`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200 hover:border-gray-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-slate-900 font-medium">没有找到任务</h3>
              <p className="text-slate-500 text-sm mt-1">试着添加一个新任务，或者切换筛选条件</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className={`group relative bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
                  task.completed 
                    ? 'border-gray-100 bg-gray-50 opacity-75' 
                    : 'border-gray-200 border-l-4'
                } ${!task.completed ? (
                  task.priority === 'high' ? 'border-l-red-500' :
                  task.priority === 'medium' ? 'border-l-yellow-500' : 
                  'border-l-blue-500'
                ) : 'border-l-gray-200'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 text-transparent hover:border-indigo-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${priorityConfig[task.priority].color} font-medium`}>
                        {priorityConfig[task.priority].label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {task.category}
                      </span>
                    </div>
                    
                    <p className={`text-base break-words ${task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                      {task.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                    title="删除任务"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {tasks.some(t => t.completed) && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={clearCompleted}
              className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清理所有已完成任务
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;