import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AddCategoryForm from './AddCategoryForm';
import PriceHistoryView from './PriceHistoryView';
import { isPriceHistoryAvailable, setupTemporaryPriceHistory, getPriceHistory } from '../../utils/priceHistoryUtils';
import { getStandardUnit, isWeightUnit, isVolumeUnit, isCountUnit } from '../../utils/unitUtils';

const EditInventoryForm = ({ item, onUpdate, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category_id: item?.category_id || '',
    quantity: item?.quantity || '',
    unit: item?.unit || '',
    last_price: item?.last_price || ''
  });
  const [errors, setErrors] = useState({});

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await window.api.categories.getAll();

      if (!categoriesData || !Array.isArray(categoriesData)) {
        console.warn('Categories data is undefined or not an array');
        setCategories([]);
        return;
      }

      // Sort categories to ensure default categories appear first, followed by custom categories
      const defaultCategoryNames = new Set(defaultCategories);
      const sortedCategories = [...categoriesData].sort((a, b) => {
        const aIsDefault = defaultCategoryNames.has(a.name);
        const bIsDefault = defaultCategoryNames.has(b.name);

        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;
        return a.name.localeCompare(b.name);
      });

      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    // Fetch price history for this item
    const fetchPriceHistory = async () => {
      if (item && item.id) {
        try {
          // Check if the price history feature is available
          if (!isPriceHistoryAvailable()) {
            console.log('Price history feature not available, attempting to set up temporary implementation');

            // Try to set up a temporary implementation
            const setupSuccess = setupTemporaryPriceHistory();

            if (!setupSuccess || !isPriceHistoryAvailable()) {
              console.error('Failed to set up price history feature');
              setPriceHistory([]);
              return;
            }

            console.log('Temporary price history implementation set up successfully');
          }

          // Use our utility function to get price history
          const history = await getPriceHistory(item.id);
          setPriceHistory(history || []);
        } catch (error) {
          console.error('Error fetching price history:', error);
          setPriceHistory([]);
        }
      }
    };

    fetchPriceHistory();
  }, [item]);

  useEffect(() => {
    // Update form data when item changes
    if (item) {
      setFormData({
        name: item.name || '',
        category_id: item.category_id || '',
        quantity: item.quantity || '',
        unit: item.unit || '',
        last_price: item.last_price || '',
        is_empty: item.is_empty || 0
      });
    }
  }, [item]);

  // No longer need handleAddCategory since category is not editable

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Skip handling for name and category_id since they're not editable anymore
    if (name === 'name' || name === 'category_id') {
      return;
    }

    // If changing quantity, check if we need to update is_empty status
    if (name === 'quantity') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0 && item.is_empty) {
        // If quantity is greater than 0 and item was empty, update is_empty status
        setFormData(prev => ({
          ...prev,
          [name]: value,
          is_empty: 0 // Set to not empty
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear general error when any field is changed
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // No need to validate name and category as they're not editable anymore

    if (formData.quantity) {
      const quantityNum = Number(formData.quantity);
      if (isNaN(quantityNum)) {
        newErrors.quantity = 'Quantity must be a number';
      } else if (quantityNum < 0) {
        newErrors.quantity = 'Quantity cannot be negative';
      }
    }

    if (formData.last_price) {
      const priceNum = Number(formData.last_price);
      if (isNaN(priceNum)) {
        newErrors.last_price = 'Price must be a number';
      } else if (priceNum < 0) {
        newErrors.last_price = 'Price cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert numeric fields to numbers
      const quantity = formData.quantity ? Number(formData.quantity) : 0;

      // Only include fields that can be edited (exclude name and category_id)
      const itemData = {
        id: item.id,
        quantity: quantity,
        unit: formData.unit,
        last_price: formData.last_price ? Number(formData.last_price) : null,
        is_empty: formData.is_empty !== undefined ? formData.is_empty : (quantity > 0 ? 0 : 1)
      };

      await onUpdate(itemData);
    } catch (error) {
      console.error('Error updating inventory item:', error);

      // Set a generic error
      setErrors(prev => ({
        ...prev,
        general: 'Failed to update item. Please try again.'
      }));
    }
  };

  const unitOptions = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'bag', label: 'Bag' }
  ];

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 className="text-xl font-semibold mb-4">Edit Inventory Item</h2>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      <div className="mb-4">
        <label className="input-label">Item Name</label>
        <div className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
          {formData.name}
        </div>
      </div>

      <div className="mb-4">
        <label className="input-label">Category</label>
        <div className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
          {categories && categories.length > 0
            ? categories.find(c => c.id === Number(formData.category_id))?.name || 'Uncategorized'
            : 'Loading categories...'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity"
          id="quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="0"
          error={errors.quantity}
        />

        <Select
          label="Unit"
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select a unit' },
            ...unitOptions
          ]}
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col flex-grow">
            <Input
              label={`Unit Price (₹ per ${formData.unit ? getStandardUnit(formData.unit) : 'unit'})`}
              id="last_price"
              name="last_price"
              type="number"
              value={formData.last_price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              error={errors.last_price}
            />

            <div className="text-xs mt-1 bg-green-100 p-2 rounded-md text-green-800">
              <span className="font-bold">MANUAL SETTING ONLY</span>
              <span className="block mt-1">
                This unit price is only updated manually by you. It will NOT change automatically when adding items to collections.
              </span>

              {formData.unit && (
                <div className="mt-1">
                  {isWeightUnit(formData.unit) && (
                    <span>Enter the price per kg, regardless of the quantity in stock</span>
                  )}
                  {isVolumeUnit(formData.unit) && (
                    <span>Enter the price per liter, regardless of the quantity in stock</span>
                  )}
                  {isCountUnit(formData.unit) && (
                    <span>Enter the price per {formData.unit}, regardless of the quantity in stock</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 ml-4">
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={() => setIsPriceHistoryModalOpen(true)}
            >
              View Price History
            </Button>
          </div>
        </div>

        {/* Display Last Spent Price */}
        {item && item.last_spent_price && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-700">
              Last Spent Price: ₹{parseFloat(item.last_spent_price).toFixed(2)}
            </p>
            <p className="text-xs text-blue-600">
              This is the total amount spent last time for this item
            </p>
          </div>
        )}

        <div className="mt-2 text-sm text-gray-600">
          {priceHistory.length > 0 ? (
            <>
              <p>
                <strong>Price History:</strong> {priceHistory.length} records available
              </p>
              <p className="text-xs">
                Last price change: {new Date(priceHistory[0]?.recorded_at).toLocaleDateString()} -
                ₹{priceHistory[0]?.unit_price.toFixed(2)} per {item?.unit || 'unit'}
              </p>
            </>
          ) : (
            <p>
              <strong>Price History:</strong> No price history available yet.
              Add this item to a collection to start tracking prices.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          Update Item
        </Button>
      </div>

      {/* Price History Modal */}
      <Modal
        isOpen={isPriceHistoryModalOpen}
        onClose={() => setIsPriceHistoryModalOpen(false)}
      >
        <PriceHistoryView
          itemId={item.id}
          itemName={item.name}
          unit={item.unit}
        />
      </Modal>
    </form>
  );
};

export default EditInventoryForm;
