const Header = ({ title, actions }) => {
  return (
    <div className="header">
      <h1 className="header-title">{title}</h1>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
};

export default Header;
