const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  let buttonClass = 'btn';

  // Add variant class
  if (variant === 'primary') {
    buttonClass += ' btn-primary';
  } else if (variant === 'secondary') {
    buttonClass += ' btn-secondary';
  } else if (variant === 'outline') {
    buttonClass += ' btn-outline';
  } else if (variant === 'danger') {
    buttonClass += ' btn-danger';
  } else if (variant === 'success') {
    buttonClass += ' btn-success';
  } else if (variant === 'info') {
    buttonClass += ' btn-info';
  }

  // Add size class
  if (size === 'sm') {
    buttonClass += ' btn-sm';
  } else if (size === 'lg') {
    buttonClass += ' btn-lg';
  }

  // Add disabled class
  if (disabled) {
    buttonClass += ' btn-disabled';
  }

  // Add custom class
  if (className) {
    buttonClass += ' ' + className;
  }

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
