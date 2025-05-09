const Card = ({
  children,
  title,
  className = '',
  footer,
  ...props
}) => {
  let cardClass = 'card';

  if (className) {
    cardClass += ' ' + className;
  }

  return (
    <div className={cardClass} {...props}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 pt-3 border-t">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
