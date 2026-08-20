import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="confirm-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          {cancelLabel && (
            <button
              type="button"
              className="confirm-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`confirm-modal-confirm ${danger ? "danger" : ""}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? `${confirmLabel.replace(/r$/, "")}ndo...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
