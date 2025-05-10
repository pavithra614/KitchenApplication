/**
 * Utility functions for price history
 */

/**
 * Check if the price history feature is available
 * @returns {boolean} - True if the feature is available, false otherwise
 */
export const isPriceHistoryAvailable = () => {
  return (
    window.api &&
    window.api.collections &&
    typeof window.api.collections.getItemPriceHistory === 'function'
  );
};

/**
 * Create a temporary implementation of the price history feature
 * This is used when the application hasn't been restarted after adding the feature
 */
export const setupTemporaryPriceHistory = () => {
  if (!isPriceHistoryAvailable() && window.api && window.api.collections) {
    console.log('Setting up temporary price history implementation');
    
    // Create a temporary implementation that returns an empty array
    window.api.collections.getItemPriceHistory = async (itemId) => {
      console.log('Using temporary price history implementation for item:', itemId);
      return [];
    };
    
    return true;
  }
  
  return false;
};

/**
 * Get price history for an item
 * @param {number} itemId - The ID of the item
 * @returns {Promise<Array>} - A promise that resolves to an array of price history entries
 */
export const getPriceHistory = async (itemId) => {
  // Check if the feature is available
  if (!isPriceHistoryAvailable()) {
    // Try to set up a temporary implementation
    setupTemporaryPriceHistory();
    
    // Check again if the feature is available
    if (!isPriceHistoryAvailable()) {
      console.error('Price history feature is not available');
      return [];
    }
  }
  
  try {
    return await window.api.collections.getItemPriceHistory(itemId);
  } catch (error) {
    console.error('Error getting price history:', error);
    return [];
  }
};
