import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Updates the user's learning goals based on a new activity.
 * @param {string} userId - The user's UID.
 * @param {object} activity - The completed activity object.
 *  Expected properties: { type: 'quiz' | 'exercice' | 'revision', matiere: string, quantity: number }
 */
export const updateLearningGoals = async (userId, activity) => {
  if (!userId || !activity) return;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const goals = userData.goals || [];

    let hasUpdates = false;

    const updatedGoals = goals.map(goal => {
      // 1. Check if goal is still active (date check could be added here)
      // 2. Check if the activity matches the goal's subject and type
      
      // Simple matching logic:
      const matchesMatiere = goal.matiere && activity.matiere && goal.matiere.toLowerCase() === activity.matiere.toLowerCase();
      const matchesType = goal.cible && activity.type && goal.cible.toLowerCase().includes(activity.type.toLowerCase());
      
      // Alternatively, if it's a general goal without strict constraints
      const isGeneralMatch = (!goal.matiere || matchesMatiere) && (!goal.cible || matchesType || (goal.type && goal.type.toLowerCase() === activity.type.toLowerCase()));

      if (isGeneralMatch && goal.progress < 100) {
        // Increment current value
        const increment = activity.quantity || 1;
        const newCurrentValue = (goal.currentValue || 0) + increment;
        
        // Calculate new progress percentage
        let newProgress = Math.min(100, Math.round((newCurrentValue / (goal.targetValue || 10)) * 100));
        
        hasUpdates = true;
        return {
          ...goal,
          currentValue: newCurrentValue,
          progress: newProgress
        };
      }
      return goal;
    });

    if (hasUpdates) {
      await updateDoc(userRef, { goals: updatedGoals });
      console.log('✅ Learning goals updated successfully!');
    }

  } catch (error) {
    console.error('❌ Error updating learning goals:', error);
  }
};
