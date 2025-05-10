import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import AddCollectionItemForm from './AddCollectionItemForm';

const CollectionDetails = ({ collectionId, onClose, onCollectionUpdated }) => {
  const [collection, setCollection] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // Fetch collection details and items
  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);

        // Fetch collection details
        const collectionData = await window.api.collections.getById(collectionId);
        setCollection(collectionData);

        // Fetch collection items
        const itemsData = await window.api.collections.getItems(collectionId);
        setCollectionItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching collection data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionId]);

  // Handle adding an item to the collection
  const handleAddItem = async (itemData) => {
    try {
      console.log('Adding item to collection:', itemData);
      await window.api.collections.addItem({
        ...itemData,
        collection_id: collectionId
      });

      // Refresh collection data
      const updatedCollection = await window.api.collections.getById(collectionId);
      setCollection(updatedCollection);

      // Refresh collection items
      const updatedItems = await window.api.collections.getItems(collectionId);
      setCollectionItems(updatedItems || []);

      // Close the modal
      setIsAddItemModalOpen(false);

      // Notify parent component that collection was updated
      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
    } catch (error) {
      console.error('Error adding item to collection:', error);
    }
  };

  // Handle opening the add item modal
  const handleOpenAddItemModal = (e) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    console.log('Opening add item modal');
    setIsAddItemModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        Loading collection details...
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-8 text-red-500">
        Collection not found or an error occurred.
        <div className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-details" style={{ width: '100%', maxWidth: '800px' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{collection.name}</h2>
        <Button
          variant="primary"
          onClick={handleOpenAddItemModal}
        >
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Purchase Date</p>
          <p className="font-medium">{formatDate(collection.purchase_date)}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Amount</p>
          <p className="text-xl font-bold">₹{collection.total_amount?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {collection.notes && (
        <Card className="mb-6">
          <h3 className="text-md font-medium mb-2">Notes</h3>
          <p className="text-gray-700">{collection.notes}</p>
        </Card>
      )}

      <h3 className="text-lg font-medium mb-4">Collection Items ({collectionItems.length})</h3>

      {collectionItems.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No items in this collection yet.</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            onClick={handleOpenAddItemModal}
          >
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-right">Quantity</th>
                <th className="p-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {collectionItems.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-gray-600">{item.category_name || 'Uncategorized'}</td>
                  <td className="p-2 text-right">
                    {item.quantity} {item.unit || 'units'}
                  </td>
                  <td className="p-2 text-right font-medium">₹{item.price.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td colSpan="3" className="p-2 text-right">Total:</td>
                <td className="p-2 text-right">₹{collection.total_amount?.toFixed(2) || '0.00'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={onClose}>Close</Button>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
      >
        <AddCollectionItemForm
          onAdd={handleAddItem}
          onCancel={() => setIsAddItemModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default CollectionDetails;
