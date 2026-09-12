import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';

export function QuestJournal({ open, onClose, onTaskCompleted }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [addingTask, setAddingTask] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');

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

  const handleAddCustomTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.rpc('add_custom_task', {
        p_title: title,
        p_description: description,
        p_topic: topic,
        p_difficulty: difficulty
      });
      
      if (error) throw error;
      
      const { data: updatedTasks, error: loadError } = await supabase
        .from('tasks')
        .select('*')
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (loadError) throw loadError;
      setTasks(updatedTasks);
      
      setAddingTask(false);
      setTitle('');
      setDescription('');
      setTopic('');
      setDifficulty('Beginner');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            
            {error && <p className="quest-error" role="alert">{error}</p>}
            
            <div className="quest-journal-content">
              {addingTask ? (
                <form className="quest-form" onSubmit={handleAddCustomTask}>
                  <h3>Create Custom Task</h3>
                  <label>
                    Title
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </label>
                  <label>
                    Description
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                  </label>
                  <label>
                    Topic
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
                  </label>
                  <label>
                    Difficulty
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="Beginner">Beginner (40 XP / 10 Coins)</option>
                      <option value="Intermediate">Intermediate (70 XP / 20 Coins)</option>
                      <option value="Advanced">Advanced (100 XP / 30 Coins)</option>
                    </select>
                  </label>
                  <div className="quest-form-actions">
                    <button type="button" onClick={() => setAddingTask(false)}>Cancel</button>
                    <button type="submit" disabled={loading || !title}>Accept Quest</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="quest-list-actions">
                    <button onClick={() => setAddingTask(true)}>+ Add Custom Quest</button>
                  </div>
                  
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
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
