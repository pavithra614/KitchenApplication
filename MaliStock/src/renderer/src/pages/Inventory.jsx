import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AddInventoryForm from '../components/inventory/AddInventoryForm';
import EditInventoryForm from '../components/inventory/EditInventoryForm';
import PriceHistoryView from '../components/inventory/PriceHistoryView';
import { setupTemporaryPriceHistory } from '../utils/priceHistoryUtils';

const Inventory = ({ isAddModalOpen, setIsAddModalOpen }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // If isAddModalOpen and setIsAddModalOpen are not provided as props, use local state
  const [localIsAddModalOpen, setLocalIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    category_id: undefined,
    is_empty: undefined
  });

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToMarkEmpty, setItemToMarkEmpty] = useState(null);

  // State for price history modal
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [selectedItemForPriceHistory, setSelectedItemForPriceHistory] = useState(null);

  // Use props if provided, otherwise use local state
  const modalOpen = isAddModalOpen !== undefined ? isAddModalOpen : localIsAddModalOpen;
  const setModalOpen = setIsAddModalOpen || setLocalIsAddModalOpen;

  // Default categories that should always be available
  const defaultCategories = [
    'Spices',
    'Grains',
    'Pulses',
    'Oils',
    'Dairy',
    'Vegetables',
    'Fruits',
    'Snacks',
    'Beverages',
    'Cleaning Supplies',
    'Others'
  ];

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const categoriesData = await window.api.categories.getAll();
      if (categoriesData) {
        setCategories(categoriesData);
      } else {
        console.warn('Categories data is undefined');
        setCategories([]);
      }

      // Fetch inventory items with filters
      const items = await window.api.inventory.getAll(filters);
      if (items) {
        setInventoryItems(items);
      } else {
        console.warn('Inventory items data is undefined');
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      // Set empty arrays to prevent undefined errors
      setCategories([]);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up temporary price history implementation when component mounts
  useEffect(() => {
    setupTemporaryPriceHistory();
  }, []);

  // Fetch inventory data when filters change
  useEffect(() => {
    fetchInventoryData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // Special handling for is_empty filter
    if (name === 'is_empty') {
      // If value is empty string, set it to undefined to show all items
      const processedValue = value === '' ? undefined : value === '1' ? 1 : 0;

      setFilters(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
    // Special handling for category_id filter
    else if (name === 'category_id') {
      // If value is empty string, set it to undefined to show all categories
      const processedValue = value === '' ? undefined : value;

      setFilters(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
    // Default handling for other filters
    else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const confirmMarkAsEmpty = (item) => {
    setItemToMarkEmpty(item);
    setIsConfirmDialogOpen(true);
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

      // Close the confirmation dialog
      setIsConfirmDialogOpen(false);
      setItemToMarkEmpty(null);
    } catch (error) {
      console.error(`Error marking item ${id} as empty:`, error);
    }
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      category_id: undefined,
      is_empty: undefined
    });
  };

  const handleAddItem = async (itemData) => {
    try {
      // Add the item to the database
      const newItemId = await window.api.inventory.add(itemData);

      // Refresh the inventory data
      await fetchInventoryData();

      // Close the modal
      setModalOpen(false);

      return newItemId;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleViewPriceHistory = (item) => {
    setSelectedItemForPriceHistory(item);
    setIsPriceHistoryModalOpen(true);
  };

  const handleUpdateItem = async (itemData) => {
    try {
      // Update the item in the database
      await window.api.inventory.update(itemData.id, itemData);

      // Refresh the inventory data
      await fetchInventoryData();

      // Close the modal
      setIsEditModalOpen(false);
      setSelectedItem(null);

      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  };

  return (
    <div>
      {/* Sticky filter section that stays visible when scrolling */}
      <div className="sticky top-0 z-10 bg-white pb-4 pt-0 mt-0" style={{ marginTop: '-1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Card className="mb-4 shadow-md">
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
                // Show default categories first
                ...(categories && categories.length > 0
                  ? defaultCategories.map(catName => {
                      // Find the category in the fetched categories
                      const existingCat = categories.find(c => c && c.name === catName);
                      return existingCat
                        ? { value: existingCat.id, label: existingCat.name }
                        : null;
                    }).filter(Boolean)
                  : []),
                // Then show any additional user-added categories
                ...(categories && categories.length > 0
                  ? categories
                      .filter(cat => cat && !defaultCategories.includes(cat.name))
                      .map(cat => ({ value: cat.id, label: cat.name }))
                  : [])
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

            <Button onClick={() => setModalOpen(true)}>
              Add New Item
            </Button>
          </div>
        </Card>
      </div>

      {/* Content area with padding to separate from sticky header */}
      <div className="pt-2">
        {loading ? (
          <div className="text-center py-8">Loading inventory items...</div>
        ) : (
          <div style={{ height: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '5px' }}>
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
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="font-medium">
                          {item.last_price ? `₹${item.last_price.toFixed(2)} per ${item.unit}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {item.last_spent_price && (
                      <div className="mb-4 bg-blue-50 p-2 rounded-md">
                        <p className="text-xs text-blue-700">Last Spent Price</p>
                        <p className="font-medium text-blue-800">
                          ₹{parseFloat(item.last_spent_price).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="mr-2"
                        >
                          Edit
                        </Button>

                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewPriceHistory(item)}
                        >
                          Price History
                        </Button>
                      </div>

                      {!item.is_empty && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmMarkAsEmpty(item)}
                        >
                          Mark as Empty
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <AddInventoryForm
          onAdd={handleAddItem}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Edit Inventory Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
      >
        {selectedItem && (
          <EditInventoryForm
            item={selectedItem}
            onUpdate={handleUpdateItem}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
          />
        )}
      </Modal>

      {/* Confirm Mark as Empty Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setItemToMarkEmpty(null);
        }}
        onConfirm={() => {
          if (itemToMarkEmpty) {
            handleMarkAsEmpty(itemToMarkEmpty.id);
          }
        }}
        title="Mark Item as Empty"
        message={`Are you sure you want to mark "${itemToMarkEmpty?.name}" as empty? This will set the quantity to 0.`}
        confirmText="Mark as Empty"
        cancelText="Cancel"
      />

      {/* Price History Modal */}
      <Modal
        isOpen={isPriceHistoryModalOpen}
        onClose={() => {
          setIsPriceHistoryModalOpen(false);
          setSelectedItemForPriceHistory(null);
        }}
      >
        {selectedItemForPriceHistory && (
          <PriceHistoryView
            itemId={selectedItemForPriceHistory.id}
            itemName={selectedItemForPriceHistory.name}
            unit={selectedItemForPriceHistory.unit}
          />
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
