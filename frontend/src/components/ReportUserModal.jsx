import { useState } from "react";
import { reportarUsuario, MOTIVOS_REPORTE_USUARIO } from "../services/reportService";
import "./ReportUserModal.css";

// Modal para reportar el perfil de otro usuario ("Reportar Planeta").
const ReportUserModal = ({ reporterId, reportedUserId, reportedName, onClose, onReported }) => {
  const [motivo, setMotivo] = useState(MOTIVOS_REPORTE_USUARIO[0].value);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!reporterId || !reportedUserId) {
      setError("No se pudo identificar a los usuarios involucrados.");
      return;
    }

    try {
      setEnviando(true);
      await reportarUsuario({
        reporterId,
        reportedUserId,
        motivo,
        detalle: detalle.trim(),
      });
      onReported?.();
    } catch (err) {
      console.error("Error al reportar usuario:", err);
      setError(err.message || "No se pudo enviar el reporte. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Reportar {reportedName ? `a ${reportedName}` : "planeta"}</h3>
          <button
            type="button"
            className="report-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-field">
            <label>Motivo</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS_REPORTE_USUARIO.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>Detalles (opcional)</label>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Cuéntanos más sobre lo que pasó..."
              rows={3}
            />
          </div>

          {error && <p className="report-modal-error">{error}</p>}

          <div className="report-modal-actions">
            <button type="button" className="btn-cancelar" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn-reportar" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;
