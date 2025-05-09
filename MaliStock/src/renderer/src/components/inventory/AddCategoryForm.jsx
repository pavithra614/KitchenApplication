import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddCategoryForm = ({ onAdd, onCancel }) => {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCategoryName(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add the category
      const categoryId = await window.api.categories.add(categoryName);
      
      // Clear the form
      setCategoryName('');
      
      // Call the onAdd callback with the new category
      onAdd({ id: categoryId, name: categoryName });
      
      // Close the form
      onCancel();
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
      
      <Input
        label="Category Name"
        id="categoryName"
        name="categoryName"
        value={categoryName}
        onChange={handleChange}
        placeholder="Enter category name"
        required
        error={error}
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
          Add Category
        </Button>
      </div>
    </form>
  );
};

export default AddCategoryForm;
