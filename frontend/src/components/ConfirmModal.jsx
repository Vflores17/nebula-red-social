import React from "react";
import "./ConfirmModal.css";

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="confirm-modal-title">{title}</h3>}
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-modal-btn confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
