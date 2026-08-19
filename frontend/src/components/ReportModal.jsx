import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reportPost, reportUser } from "../services/reportService";
import "./ReportModal.css";

const MOTIVOS = [
  "Spam o publicidad no deseada",
  "Contenido ofensivo o de odio",
  "Acoso",
  "Información falsa",
  "Otro",
];

const ReportModal = ({ targetType, targetId, onClose }) => {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const handleEnviar = async () => {
    if (!user) {
      setError("Debes iniciar sesión para enviar un reporte.");
      return;
    }

    const detalleLimpio = detalle.trim();
    const razonCompleta = detalleLimpio ? `${motivo}: ${detalleLimpio}` : motivo;

    setEnviando(true);
    setError("");
    try {
      if (targetType === "post") {
        await reportPost(user.uid, targetId, razonCompleta);
      } else if (targetType === "user") {
        await reportUser(user.uid, targetId, razonCompleta);
      } else {
        throw new Error("El tipo de reporte no es válido.");
      }

      setEnviado(true);
    } catch (reportError) {
      console.error("Error al enviar el reporte:", reportError);
      setError(reportError.message || "No se pudo enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={enviando ? undefined : onClose}>
      <div
        className="report-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {enviado ? (
          <div className="report-modal-result" role="status">
            <h2 id="report-modal-title">Reporte enviado</h2>
            <p>✅ Gracias por ayudar a cuidar la comunidad.</p>
            <button type="button" className="report-modal-primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 id="report-modal-title">
              🚩 Reportar {targetType === "post" ? "publicación" : "usuario"}
            </h2>

            <label htmlFor="report-reason">Motivo</label>
            <select
              id="report-reason"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              disabled={enviando}
            >
              {MOTIVOS.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>

            <label htmlFor="report-detail">Detalle adicional (opcional)</label>
            <textarea
              id="report-detail"
              value={detalle}
              onChange={(event) => setDetalle(event.target.value)}
              placeholder="Cuéntanos brevemente qué ocurrió..."
              disabled={enviando}
            />

            {error && <p className="report-modal-error" role="alert">{error}</p>}

            <div className="report-modal-actions">
              <button type="button" onClick={onClose} disabled={enviando}>
                Cancelar
              </button>
              <button
                type="button"
                className="report-modal-primary"
                onClick={handleEnviar}
                disabled={enviando}
              >
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
