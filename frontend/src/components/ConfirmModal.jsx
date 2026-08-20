import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen = true,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
  onCancel,
}) => {
  const handleClose = onClose || onCancel;

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={loading ? undefined : handleClose}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "confirm-modal-title" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>}
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="confirm-modal-actions">
          {cancelLabel && (
            <button
              type="button"
              className="confirm-modal-btn cancel"
              onClick={handleClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`confirm-modal-btn confirm${danger ? " danger" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
