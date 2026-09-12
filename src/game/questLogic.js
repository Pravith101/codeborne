import { supabase } from '../lib/supabaseClient';

/**
 * Game-driven quest progression mechanism.
 * quest event -> check active quests -> verify objective -> complete matching quest
 */
export async function processQuestEvent(eventType, eventData) {
  try {
    // 1. Fetch player's active (incomplete) quests
    const { data: activeQuests, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false);
      
    if (error || !activeQuests || activeQuests.length === 0) return false;

    const questsToComplete = [];
    
    // 2. Verify objective against game event
    for (const quest of activeQuests) {
      if (eventType === 'code_submitted') {
        const code = (eventData || '').toLowerCase().replace(/\s+/g, '');
        
        if (quest.topic === 'Variables' && code.includes('=')) {
          questsToComplete.push(quest.id);
        } else if (quest.topic === 'Input & Output' && code.includes('print(')) {
          questsToComplete.push(quest.id);
        } else if (quest.topic === 'if / elif / else' && code.includes('if')) {
          questsToComplete.push(quest.id);
        }
      }
    }

    // 3. Complete matching quests securely via RPC
    let completedAny = false;
    for (const questId of questsToComplete) {
      const { error: completeErr } = await supabase.rpc('complete_task', { p_task_id: questId });
      if (!completeErr) {
        completedAny = true;
      }
    }
    
    return completedAny;
  } catch (err) {
    console.error('Quest processing error:', err);
    return false;
  }
}
