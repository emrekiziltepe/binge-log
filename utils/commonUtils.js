/**
 * Common utility functions used across the application
 */

/**
 * Remove duplicate activities from an array based on activity ID and firebaseId
 * @param {Array} activitiesList - Array of activity objects
 * @returns {Array} - Array with duplicates removed
 */
export const removeDuplicates = (activitiesList) => {
  return activitiesList.filter((activity, index, self) => {
    // Check for duplicates by id
    const idIndex = self.findIndex(a => a.id === activity.id);
    if (idIndex !== index) {
      return false;
    }
    
    // Also check for duplicates by firebaseId (if present)
    if (activity.firebaseId) {
      const firebaseIdIndex = self.findIndex(a => 
        a.firebaseId && a.firebaseId === activity.firebaseId
      );
      if (firebaseIdIndex !== index) {
        return false;
      }
    }
    
    return true;
  });
};

