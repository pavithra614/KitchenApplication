import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddCollectionForm = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    purchase_date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle form input changes
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
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const collectionData = {
        name: formData.name.trim(),
        purchase_date: formData.purchase_date,
        notes: formData.notes.trim(),
        total_amount: 0 // Will be updated when items are added
      };

      await onAdd(collectionData);
    } catch (error) {
      console.error('Error adding collection:', error);

      // Set a generic error
      setErrors(prev => ({
        ...prev,
        general: 'Failed to add collection. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 className="text-xl font-semibold mb-4">Add New Collection</h2>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      <Input
        label="Collection Name"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter collection name (e.g., Weekly Grocery)"
        required
        error={errors.name}
      />

      <Input
        label="Purchase Date"
        id="purchase_date"
        name="purchase_date"
        type="date"
        value={formData.purchase_date}
        onChange={handleChange}
        required
        error={errors.purchase_date}
      />

      <div className="mb-4">
        <label htmlFor="notes" className="input-label">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes about this collection"
          className="input h-24"
        />
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
          Add Collection
        </Button>
      </div>
    </form>
  );
};

export default AddCollectionForm;
