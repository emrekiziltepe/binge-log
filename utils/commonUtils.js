/**
 * Common utility functions used across the application
 */

/**
 * Remove duplicate activities from an array based on activity ID
 * @param {Array} activitiesList - Array of activity objects
 * @returns {Array} - Array with duplicates removed
 */
export const removeDuplicates = (activitiesList) => {
  return activitiesList.filter((activity, index, self) => 
    index === self.findIndex(a => a.id === activity.id)
  );
};

