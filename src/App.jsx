import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Check, LayoutList, 
  LogOut, Filter, Tag, CheckCircle2, Loader2 
} from 'lucide-react';

// 引入 Firebase 功能
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, deleteDoc, updateDoc, 
  doc, query, onSnapshot, orderBy, serverTimestamp, where 
} from 'firebase/firestore';

const App = () => {
  // ---------------- State Management ----------------
  const [user, setUser] = useState(null); // 用户状态
  const [loadingAuth, setLoadingAuth] = useState(true); // 是否正在检查登录
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('工作');
  const [priority, setPriority] = useState('medium');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['工作', '生活', '学习', '健康', '杂项'];
  const priorityConfig = {
    high: { label: '高优', color: 'text-red-600 bg-red-50 border-red-200' },
    medium: { label: '中等', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    low: { label: '低优', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  };

  // 1. 监听用户登录状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. 监听数据库变化 (实时同步核心)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    // 查询：只获取属于当前用户的任务，并按创建时间倒序
    // 注意：Firestore 复合查询可能需要建立索引，如果控制台报错，请点击报错链接去创建索引
    // 这里我们先在前端做排序，只查属于该用户的
    const q = query(
      collection(db, 'tasks'), 
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(cloudTasks);
    });

    return () => unsubscribe();
  }, [user]);

  // ---------------- Handlers (CRUD) ----------------
  
  // 登录
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("登录失败: " + error.message);
    }
  };

  // 退出
  const handleLogout = () => signOut(auth);

  // 添加任务 (写入云端)
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;

    await addDoc(collection(db, 'tasks'), {
      text: newTask,
      category,
      priority,
      completed: false,
      createdAt: serverTimestamp(), // 使用服务器时间
      uid: user.uid // 关键：标记这个任务属于谁
    });

    setNewTask('');
  };

  // 切换状态 (更新云端)
  const toggleTask = async (id, currentStatus) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: !currentStatus
    });
  };

  // 删除任务 (删除云端)
  const deleteTask = async (id) => {
    const taskRef = doc(db, 'tasks', id);
    await deleteDoc(taskRef);
  };

  // 清理已完成 (批量删除)
  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    // Firestore 批量操作建议使用 batch，这里为了简单使用循环
    completedTasks.forEach(async (task) => {
      await deleteDoc(doc(db, 'tasks', task.id));
    });
  };

  // ---------------- Filtering & Sorting (Frontend) ----------------
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
      // 本地辅助排序逻辑
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // 处理 timestamp 可能为空的情况 (刚写入瞬间)
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
  };
  
  const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  // ---------------- Render ----------------

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 未登录界面
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutList className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">欢迎使用井井有条</h1>
          <p className="text-slate-500 mb-8">
            请登录以启用云端同步功能。<br/>您的任务将会在所有设备间保持一致。
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            使用 Google 账号登录
          </button>
        </div>
      </div>
    );
  }

  // 已登录界面 (主程序)
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {user.displayName?.[0]}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">你好, {user.displayName}</h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  {stats.active} 个待办事项
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={addTask} className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="添加新的待办事项..."
                className="flex-grow w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="high">高优</option>
                  <option value="medium">中等</option>
                  <option value="low">低优</option>
                </select>
                <button 
                  type="submit"
                  disabled={!newTask.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-lg flex items-center shadow-md flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
            {['all', 'active', 'completed'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  filterStatus === status ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? '全部' : status === 'active' ? '进行中' : '已完成'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <button 
              onClick={() => setFilterCategory('all')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border ${
                filterCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'
                }`}
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
              <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-slate-900 font-medium">列表空空如也</h3>
              <p className="text-slate-500 text-sm">云端数据已同步，暂无相关任务</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className={`relative bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
                  task.completed ? 'border-gray-100 bg-gray-50 opacity-75' : 'border-gray-200 border-l-4'
                } ${
                  !task.completed ? (
                    task.priority === 'high' ? 'border-l-red-500' :
                    task.priority === 'medium' ? 'border-l-yellow-500' : 
                    'border-l-blue-500'
                  ) : 'border-l-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {task.category}
                      </span>
                    </div>
                    <p className={`text-sm sm:text-base break-words ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.text}
                    </p>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {tasks.some(t => t.completed) && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={clearCompleted}
              className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清理已完成 (同步删除)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;