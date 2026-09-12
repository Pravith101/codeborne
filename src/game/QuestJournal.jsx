import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';

export function QuestJournal({ open, onClose, onTaskCompleted }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    
    async function loadTasks() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    }
    
    loadTasks();
    return () => { active = false; };
  }, [open]);

  const handleComplete = async (taskId) => {
    if (loading) return;
    try {
      const { error } = await supabase.rpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      
      if (onTaskCompleted) {
        onTaskCompleted();
      }
    } catch (err) {
      setError(err.message);
    }
  };



  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="quest-journal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="quest-journal-panel"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            role="dialog"
            aria-label="Quest Journal"
          >
            <div className="quest-journal-header">
              <h2>Quest Journal</h2>
              <button onClick={onClose} aria-label="Close journal">×</button>
            </div>
            
            {error ? (
              <div className="quest-error-state" style={{ padding: '24px', textAlign: 'center', color: '#a69888' }}>
                <p style={{ color: '#e88e8e', margin: '0 0 8px 0', font: '600 16px "Fraunces", serif' }}>The journal is currently sealed.</p>
                <small style={{ color: '#8a3f3f', fontSize: '12px', background: 'rgba(42, 16, 16, 0.4)', padding: '8px', borderRadius: '4px', display: 'inline-block', maxWidth: '400px' }}>{error}</small>
              </div>
            ) : (
              <div className="quest-journal-content">
                {loading && tasks.length === 0 ? (
                  <p className="quest-loading">Reading ancient scrolls...</p>
                ) : (
                  <ul className="quest-list">
                    {tasks.map(task => (
                      <li key={task.id} className={`quest-item ${task.completed ? 'completed' : ''}`}>
                        <div className="quest-item-header">
                          <h4>{task.title}</h4>
                          <span className="quest-topic">{task.topic}</span>
                        </div>
                        {task.description && <p className="quest-desc">{task.description}</p>}
                        <div className="quest-item-footer">
                          <span className="quest-rewards">
                            <span>⭐ {task.xp_reward} XP</span>
                            <span>◉ {task.coin_reward}</span>
                          </span>
                          {!task.completed ? (
                            <button onClick={() => handleComplete(task.id)} disabled={loading}>Complete</button>
                          ) : (
                            <span className="quest-done-mark">Completed</span>
                          )}
                        </div>
                      </li>
                    ))}
                    {tasks.length === 0 && <p className="quest-empty">Your journal is empty.</p>}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
