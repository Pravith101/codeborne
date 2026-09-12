import { supabase } from '../lib/supabaseClient';

/**
 * Event-based quest progression layer.
 * 
 * Example usage:
 * processQuestEvent("coding_challenge_completed", { challengeKey: "echoes_of_forest", success: true })
 * processQuestEvent("boss_defeated", { bossName: "Loop Warden" })
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
      if (eventType === 'coding_challenge_completed' && eventData.success) {
        if (quest.objective_type === 'coding_challenge' && quest.objective_key === eventData.challengeKey) {
          questsToComplete.push(quest.id);
        }
      }
      
      // Example of a verifiable event:
      // if (eventType === 'boss_defeated' && quest.objective_type === 'boss_defeat') {
      //   questsToComplete.push(quest.id);
      // }
    }

    // 3. Complete matching quests securely via RPC
    let completedAny = false;
    for (const questId of questsToComplete) {
      // The complete_task RPC must authoritatively verify these completions
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
