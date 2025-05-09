import { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Button from './components/ui/Button';

function App() {
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Handle navigation
  const handleNavigate = (navItem) => {
    setActiveNavItem(navItem);

    // Set page title based on navigation
    switch (navItem) {
      case 'dashboard':
        setPageTitle('Dashboard');
        break;
      case 'inventory':
        setPageTitle('Inventory');
        break;
      case 'collections':
        setPageTitle('Collections');
        break;
      case 'expenses':
        setPageTitle('Expenses');
        break;
      case 'categories':
        setPageTitle('Categories');
        break;
      case 'settings':
        setPageTitle('Settings');
        break;
      default:
        setPageTitle('MalaPantry');
    }
  };

  // Render content based on active navigation item
  const renderContent = () => {
    switch (activeNavItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return (
          <Inventory
            isAddModalOpen={isAddInventoryModalOpen}
            setIsAddModalOpen={setIsAddInventoryModalOpen}
          />
        );
      case 'collections':
        return <div className="text-center py-8">Collections page coming soon!</div>;
      case 'expenses':
        return <div className="text-center py-8">Expenses page coming soon!</div>;
      case 'categories':
        return <div className="text-center py-8">Categories page coming soon!</div>;
      case 'settings':
        return <div className="text-center py-8">Settings page coming soon!</div>;
      default:
        return <Dashboard />;
    }
  };

  // State for modals
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);
  const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Define actions for each page
  const renderActions = () => {
    switch (activeNavItem) {
      case 'inventory':
        return (
          <Button onClick={() => setIsAddInventoryModalOpen(true)}>
            Add New Item
          </Button>
        );
      case 'collections':
        return (
          <Button onClick={() => setIsAddCollectionModalOpen(true)}>
            Add Collection
          </Button>
        );
      case 'categories':
        return (
          <Button onClick={() => setIsAddCategoryModalOpen(true)}>
            Add Category
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      activeNavItem={activeNavItem}
      onNavigate={handleNavigate}
      title={pageTitle}
      actions={renderActions()}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
