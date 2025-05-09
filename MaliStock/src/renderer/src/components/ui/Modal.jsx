import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);
  const modalRoot = document.getElementById('modal-root') || document.body;

  useEffect(() => {
    // Create modal root if it doesn't exist
    if (!document.getElementById('modal-root')) {
      const modalRootDiv = document.createElement('div');
      modalRootDiv.id = 'modal-root';
      document.body.appendChild(modalRootDiv);
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling of the body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content" ref={modalRef}>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default Modal;
