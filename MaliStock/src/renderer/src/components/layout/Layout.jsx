import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, activeNavItem, onNavigate, title, actions }) => {
  return (
    <div className="layout">
      <Sidebar activeItem={activeNavItem} onNavigate={onNavigate} />

      <div className="main-content">
        <Header title={title} actions={actions} />

        <main className="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
