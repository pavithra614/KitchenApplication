import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    category_id: '',
    is_empty: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesData = await window.api.categories.getAll();
        setCategories(categoriesData);
        
        // Fetch inventory items with filters
        const items = await window.api.inventory.getAll(filters);
        setInventoryItems(items);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleMarkAsEmpty = async (id) => {
    try {
      await window.api.inventory.markAsEmpty(id);
      
      // Update the item in the local state
      setInventoryItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, is_empty: 1, quantity: 0 } : item
        )
      );
    } catch (error) {
      console.error(`Error marking item ${id} as empty:`, error);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      name: '',
      category_id: '',
      is_empty: ''
    });
  };
  
  return (
    <div>
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search by Name"
            id="name"
            name="name"
            value={filters.name}
            onChange={handleFilterChange}
            placeholder="Search items..."
          />
          
          <Select
            label="Category"
            id="category_id"
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat.id, label: cat.name }))
            ]}
          />
          
          <Select
            label="Status"
            id="is_empty"
            name="is_empty"
            value={filters.is_empty}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'All Items' },
              { value: '0', label: 'In Stock' },
              { value: '1', label: 'Empty' }
            ]}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="mr-2">
            Reset Filters
          </Button>
          
          <Button>
            Add New Item
          </Button>
        </div>
      </Card>
      
      {loading ? (
        <div className="text-center py-8">Loading inventory items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No inventory items found. Add some items to get started!
            </div>
          ) : (
            inventoryItems.map(item => (
              <Card key={item.id} className="relative">
                <div className="absolute top-3 right-3">
                  {item.is_empty ? (
                    <span className="badge badge-red">Empty</span>
                  ) : (
                    <span className="badge badge-green">In Stock</span>
                  )}
                </div>
                
                <h3 className="text-lg font-medium mb-2">{item.name}</h3>
                
                <div className="text-sm text-gray-500 mb-4">
                  Category: {item.category_name || 'Uncategorized'}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-medium">{item.quantity} {item.unit}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Last Price</p>
                    <p className="font-medium">
                      {item.last_price ? `₹${item.last_price.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  
                  {!item.is_empty && (
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleMarkAsEmpty(item.id)}
                    >
                      Mark as Empty
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;
