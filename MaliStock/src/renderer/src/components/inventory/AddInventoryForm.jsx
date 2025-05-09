import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AddCategoryForm from './AddCategoryForm';

const AddInventoryForm = ({ onAdd, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    quantity: '',
    unit: '',
    last_price: ''
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

      // Make sure all default categories are included
      const defaultCategoryNames = new Set(defaultCategories);
      const existingCategoryNames = new Set(categoriesData.map(cat => cat.name));

      // Sort categories to ensure default categories appear first, followed by custom categories
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
  }, []);

  const handleAddCategory = (newCategory) => {
    // Add the new category to the categories list
    setCategories(prev => {
      // Add the new category and sort again
      const updatedCategories = [...prev, newCategory];
      const defaultCategoryNames = new Set(defaultCategories);

      return updatedCategories.sort((a, b) => {
        const aIsDefault = defaultCategoryNames.has(a.name);
        const bIsDefault = defaultCategoryNames.has(b.name);

        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    // Select the new category in the form
    setFormData(prev => ({
      ...prev,
      category_id: newCategory.id
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear duplicate error when name is changed
    if (name === 'name' && duplicateError) {
      setDuplicateError('');
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

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

    // Clear any previous duplicate error
    setDuplicateError('');

    if (!validateForm()) {
      return;
    }

    try {
      // Convert numeric fields to numbers
      const itemData = {
        ...formData,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        last_price: formData.last_price ? Number(formData.last_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null
      };

      await onAdd(itemData);

      // Reset form after successful submission
      setFormData({
        name: '',
        category_id: '',
        quantity: '',
        unit: '',
        last_price: ''
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);

      // Check if it's a duplicate item error
      if (error.message && error.message.includes('already exists')) {
        setDuplicateError('An item with this name already exists in your inventory.');
      } else {
        // Set a generic error
        setErrors(prev => ({
          ...prev,
          general: 'Failed to add item. Please try again.'
        }));
      }
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
      <h2 className="text-xl font-semibold mb-4">Add New Inventory Item</h2>

      {duplicateError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {duplicateError}
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      <Input
        label="Item Name"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter item name"
        required
        error={errors.name}
      />

      <div className="mb-4">
        <label htmlFor="category_id" className="input-label">
          Category <span className="input-required">*</span>
        </label>
        <div className="flex">
          <Select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select a category' },
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
            required
            error={errors.category_id}
            className="mb-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="ml-2"
            style={{ marginBottom: '0', height: '38px' }}
          >
            + Add
          </Button>
        </div>
        {errors.category_id && <p className="input-error-message">{errors.category_id}</p>}
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

      <Input
        label="Price"
        id="last_price"
        name="last_price"
        type="number"
        value={formData.last_price}
        onChange={handleChange}
        placeholder="0.00"
        error={errors.last_price}
      />

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
          Add Item
        </Button>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
      >
        <AddCategoryForm
          onAdd={handleAddCategory}
          onCancel={() => setIsAddCategoryModalOpen(false)}
        />
      </Modal>
    </form>
  );
};

export default AddInventoryForm;
