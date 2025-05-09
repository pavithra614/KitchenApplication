import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AddCategoryForm from './AddCategoryForm';

const EditInventoryForm = ({ item, onUpdate, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
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
  }, []);

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

    if (!validateForm()) {
      return;
    }

    try {
      // Convert numeric fields to numbers
      const quantity = formData.quantity ? Number(formData.quantity) : 0;

      const itemData = {
        ...formData,
        id: item.id,
        quantity: quantity,
        last_price: formData.last_price ? Number(formData.last_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        is_empty: formData.is_empty !== undefined ? formData.is_empty : (quantity > 0 ? 0 : 1)
      };

      await onUpdate(itemData);
    } catch (error) {
      console.error('Error updating inventory item:', error);
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
          Update Item
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

export default EditInventoryForm;
