import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { isPriceHistoryAvailable, setupTemporaryPriceHistory, getPriceHistory } from '../../utils/priceHistoryUtils';

const PriceHistoryView = ({ itemId, itemName, unit }) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching price history for item ID:', itemId);

        if (!itemId) {
          console.error('Invalid item ID:', itemId);
          setError('Invalid item ID. Please try again.');
          setLoading(false);
          return;
        }

        // Check if the price history feature is available
        if (!isPriceHistoryAvailable()) {
          console.log('Price history feature not available, attempting to set up temporary implementation');

          // Try to set up a temporary implementation
          const setupSuccess = setupTemporaryPriceHistory();

          if (!setupSuccess || !isPriceHistoryAvailable()) {
            console.error('Failed to set up price history feature');
            setError('Price history feature is not available. Please restart the application.');
            setLoading(false);
            return;
          }

          console.log('Temporary price history implementation set up successfully');
        }

        // Use our utility function to get price history
        const history = await getPriceHistory(itemId);
        console.log('Price history data received:', history);

        if (!history || history.length === 0) {
          console.warn('No price history data returned');
          setPriceHistory([]);
        } else {
          setPriceHistory(history);
        }
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load price history. Please try again. Error: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [itemId]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="price-history-view">
      <h3 className="text-lg font-medium mb-4">Price History for {itemName}</h3>

      {loading ? (
        <div className="text-center py-4">Loading price history...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : priceHistory.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No price history available for this item.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Quantity</th>
                <th className="p-2 text-right">Standard Price</th>
                <th className="p-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {priceHistory.map((entry, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{formatDate(entry.recorded_at)}</td>
                  <td className="p-2 text-right">₹{entry.unit_price.toFixed(2)}</td>
                  <td className="p-2 text-right">
                    {entry.quantity} {entry.unit || unit || 'units'}
                  </td>
                  <td className="p-2 text-right">
                    {entry.standard_unit_price ? (
                      <span>
                        ₹{entry.standard_unit_price.toFixed(2)} per {entry.standard_unit || entry.unit || unit || 'unit'}
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="p-2">
                    {entry.collection_name ? (
                      <span className="text-blue-600">
                        {entry.collection_name}
                      </span>
                    ) : (
                      <span className="text-gray-500">Manual update</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-500">
          {priceHistory.length > 0 && (
            <span>Showing {priceHistory.length} price records</span>
          )}
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          Print History
        </Button>
      </div>
    </div>
  );
};

export default PriceHistoryView;
