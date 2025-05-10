import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);
  const [modalRoot, setModalRoot] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Initialize modal root
  useEffect(() => {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed, closing modal');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent scrolling of the body when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle click outside with delay
  useEffect(() => {
    if (!isOpen || isListening) return;

    // Add a significant delay before enabling click outside detection
    // This ensures the modal doesn't close from the same click that opened it
    const timeoutId = setTimeout(() => {
      setIsListening(true);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, isListening]);

  // Handle click outside
  const handleOverlayClick = (e) => {
    // Only handle clicks directly on the overlay, not its children
    if (e.target === e.currentTarget && isListening) {
      console.log('Click on overlay detected, closing modal');
      onClose();
    }
  };

  // Reset listening state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
    }
  }, [isOpen]);

  if (!isOpen || !modalRoot) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
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
