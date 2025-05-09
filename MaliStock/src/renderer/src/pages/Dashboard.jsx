import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';

const Dashboard = () => {
  const [inventorySummary, setInventorySummary] = useState({
    totalItems: 0,
    emptyItems: 0,
    categories: []
  });

  const [expenseSummary, setExpenseSummary] = useState({
    totalSpent: 0,
    recentCollections: []
  });

  useEffect(() => {
    // Fetch inventory summary
    const fetchInventorySummary = async () => {
      try {
        const items = await window.api.inventory.getAll();
        const categories = await window.api.categories.getAll();

        setInventorySummary({
          totalItems: items ? items.length : 0,
          emptyItems: items ? items.filter(item => item && item.is_empty).length : 0,
          categories: categories || []
        });
      } catch (error) {
        console.error('Error fetching inventory summary:', error);
        setInventorySummary({
          totalItems: 0,
          emptyItems: 0,
          categories: []
        });
      }
    };

    // Fetch expense summary
    const fetchExpenseSummary = async () => {
      try {
        const collections = await window.api.collections.getAll();

        if (!collections || !Array.isArray(collections)) {
          console.warn('Collections data is undefined or not an array');
          setExpenseSummary({
            totalSpent: 0,
            recentCollections: []
          });
          return;
        }

        const totalSpent = collections.reduce((total, collection) => {
          return total + (collection && collection.total_amount ? collection.total_amount : 0);
        }, 0);

        setExpenseSummary({
          totalSpent,
          recentCollections: collections.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching expense summary:', error);
        setExpenseSummary({
          totalSpent: 0,
          recentCollections: []
        });
      }
    };

    fetchInventorySummary();
    fetchExpenseSummary();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Inventory Summary">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Items</p>
            <p className="text-2xl font-bold">{inventorySummary.totalItems}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600">Empty Items</p>
            <p className="text-2xl font-bold">{inventorySummary.emptyItems}</p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Categories</h4>
          <ul className="space-y-1">
            {inventorySummary.categories && inventorySummary.categories.length > 0
              ? inventorySummary.categories.slice(0, 5).map(category => (
                  <li key={category.id} className="flex justify-between">
                    <span>{category.name}</span>
                    <span className="text-gray-500">{category.item_count} items</span>
                  </li>
                ))
              : <li className="text-gray-500">No categories found</li>
            }
          </ul>
        </div>
      </Card>

      <Card title="Expense Summary">
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-600">Total Spent</p>
          <p className="text-2xl font-bold">₹{expenseSummary.totalSpent.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Collections</h4>
          <ul className="space-y-2">
            {expenseSummary.recentCollections && expenseSummary.recentCollections.length > 0
              ? expenseSummary.recentCollections.map(collection => (
                  <li key={collection.id} className="flex justify-between border-b pb-2">
                    <span>{collection.name}</span>
                    <span className="font-medium">₹{collection.total_amount?.toFixed(2) || '0.00'}</span>
                  </li>
                ))
              : <li className="text-gray-500">No recent collections</li>
            }
          </ul>
        </div>
      </Card>

      <Card title="Quick Actions" className="md:col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-primary-50 rounded-lg text-center hover:bg-primary-100">
            <span className="block text-2xl mb-1">📦</span>
            <span className="text-sm font-medium">Add Inventory Item</span>
          </button>

          <button className="p-4 bg-secondary-50 rounded-lg text-center hover:bg-secondary-100">
            <span className="block text-2xl mb-1">🛒</span>
            <span className="text-sm font-medium">Add Collection</span>
          </button>

          <button className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100">
            <span className="block text-2xl mb-1">📊</span>
            <span className="text-sm font-medium">View Reports</span>
          </button>

          <button className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100">
            <span className="block text-2xl mb-1">🏷️</span>
            <span className="text-sm font-medium">Manage Categories</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
