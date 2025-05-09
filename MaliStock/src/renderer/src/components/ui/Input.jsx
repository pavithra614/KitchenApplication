const Input = ({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = '',
  ...props
}) => {
  let containerClass = 'mb-4';
  let inputClass = 'input';

  if (className) {
    containerClass += ' ' + className;
  }

  if (error) {
    inputClass += ' input-error';
  }

  return (
    <div className={containerClass}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="input-required">*</span>}
        </label>
      )}

      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass}
        min={type === 'number' ? 0 : undefined}
        {...props}
      />

      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
};

export default Input;
