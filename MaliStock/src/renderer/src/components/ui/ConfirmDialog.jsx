import Button from './Button';
import Modal from './Modal';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="confirm-dialog">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant={confirmVariant} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
