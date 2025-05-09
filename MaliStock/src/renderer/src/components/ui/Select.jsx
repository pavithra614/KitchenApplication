const Select = ({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  placeholder,
  className = '',
  ...props
}) => {
  let containerClass = 'mb-4';
  let selectClass = 'select';

  if (className) {
    containerClass += ' ' + className;
  }

  if (error) {
    selectClass += ' select-error';
  }

  return (
    <div className={containerClass}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="input-required">*</span>}
        </label>
      )}

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={selectClass}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
};

export default Select;
