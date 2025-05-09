import { useState } from 'react';

const Sidebar = ({ activeItem, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'collections', label: 'Collections', icon: '🛒' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <div className="sidebar-header">
        {!collapsed && <h1 className="sidebar-title">MaliStock</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`sidebar-nav-item ${activeItem === item.id ? 'active' : ''}`}
                style={collapsed ? { justifyContent: 'center' } : { justifyContent: 'flex-start' }}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-nav-text">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
