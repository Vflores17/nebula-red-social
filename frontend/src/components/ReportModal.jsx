import { useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { createReport } from "../services/reportService";
import "./ReportModal.css";

const MOTIVOS = [
  { value: "spam", label: "Spam" },
  { value: "contenido_ofensivo", label: "Contenido ofensivo" },
  { value: "acoso", label: "Acoso" },
  { value: "otro", label: "Otro" },
];

const ReportModal = ({ targetType, targetId, onClose }) => {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState(MOTIVOS[0].value);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!user?.uid || !targetId || !["post", "user"].includes(targetType)) {
      setError("No se pudo identificar el contenido reportado.");
      return;
    }

    if (targetType === "user" && user.uid === targetId) {
      setError("No puedes reportarte a ti mismo.");
      return;
    }

    const motivoSeleccionado = MOTIVOS.find((opcion) => opcion.value === motivo)?.label || motivo;
    const detalleLimpio = detalle.trim();

    try {
      setEnviando(true);
      await createReport({
        reporterId: user.uid,
        targetType,
        targetId,
        reason: detalleLimpio ? `${motivoSeleccionado}: ${detalleLimpio}` : motivoSeleccionado,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setEnviado(true);
    } catch (submitError) {
      console.error("Error al enviar el reporte:", submitError);
      setError("No se pudo enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="generic-report-overlay" onClick={enviando ? undefined : onClose}>
      <div
        className="generic-report-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generic-report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="generic-report-title">
          🚩 Reportar {targetType === "post" ? "publicación" : "usuario"}
        </h2>

        {enviado ? (
          <div className="generic-report-success">
            <p>✅ Reporte enviado. Gracias por ayudar a cuidar la comunidad.</p>
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="report-reason">Motivo</label>
            <select id="report-reason" value={motivo} onChange={(event) => setMotivo(event.target.value)}>
              {MOTIVOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>

            <label htmlFor="report-detail">Detalle</label>
            <textarea
              id="report-detail"
              value={detalle}
              onChange={(event) => setDetalle(event.target.value)}
              placeholder="Describe brevemente el problema..."
              rows={4}
            />

            {error && <p className="generic-report-error" role="alert">{error}</p>}

            <div className="generic-report-actions">
              <button type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
              <button type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
