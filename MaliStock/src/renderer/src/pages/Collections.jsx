import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AddCollectionForm from '../components/collections/AddCollectionForm';
import CollectionDetails from '../components/collections/CollectionDetails';

const Collections = ({ isAddModalOpen, setIsAddModalOpen }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);

  // Fetch all collections
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await window.api.collections.getAll();
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCollections();
  }, []);

  // Handle adding a new collection
  const handleAddCollection = async (collectionData) => {
    try {
      console.log('Adding collection:', collectionData);
      await window.api.collections.add(collectionData);
      console.log('Collection added successfully');
      fetchCollections();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding collection:', error);
    }
  };

  // Handle viewing collection details
  const handleViewDetails = (collection) => {
    setSelectedCollection(collection);
    setIsDetailsModalOpen(true);
  };

  // Handle deleting a collection
  const confirmDeleteCollection = (collection) => {
    setCollectionToDelete(collection);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await window.api.collections.delete(collectionToDelete.id);
      fetchCollections();
    } catch (error) {
      console.error(`Error deleting collection ${collectionToDelete.id}:`, error);
    }
  };

  // Filter collections based on search term
  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="collections-page">
      {/* Search and filter section */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-0"
            />
          </div>
        </div>
      </div>

      {/* Content area with padding to separate from sticky header */}
      <div className="pt-2">
        {loading ? (
          <div className="text-center py-8">Loading collections...</div>
        ) : (
          <div style={{ height: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '5px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No collections found. Add a collection to get started!
                </div>
              ) : (
                filteredCollections.map(collection => (
                  <Card key={collection.id} className="relative">
                    <div className="mb-2">
                      <h3 className="text-lg font-medium">{collection.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(collection.purchase_date)}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="font-medium">₹{collection.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Items:</span>
                        <span>{collection.item_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewDetails(collection)}
                      >
                        View Details
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => confirmDeleteCollection(collection)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Collection Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      >
        <AddCollectionForm
          onAdd={handleAddCollection}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Collection Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      >
        {selectedCollection && (
          <CollectionDetails
            collectionId={selectedCollection.id}
            onClose={() => setIsDetailsModalOpen(false)}
            onCollectionUpdated={fetchCollections}
          />
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Collections;
