import { useState } from "react";
import { updateUser } from "../services/userService";
import "./EditProfileModal.css";

// Modal de edición de perfil ("Editar Planeta").
// Recibe el perfil actual, guarda los cambios en Firestore vía userService
// y avisa al padre (ProfileHeader -> Profile) con los datos ya actualizados
// para que la UI se refresque sin necesidad de recargar la página.
const EditProfileModal = ({ profile, onClose, onSaved }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("El nombre del planeta no puede quedar vacío");
      return;
    }

    if (!profile.uid) {
      setError("No se pudo identificar tu perfil. Intenta recargar la página.");
      return;
    }

    const datos = {
      nombrePlaneta: displayName.trim(),
      biografia: bio.trim(),
      ubicacion: location.trim(),
      avatar: avatar.trim() || null,
    };

    try {
      setGuardando(true);
      await updateUser(profile.uid, datos);

      onSaved({
        displayName: datos.nombrePlaneta,
        username: datos.nombrePlaneta.toLowerCase().replace(/\s+/g, ""),
        bio: datos.biografia,
        location: datos.ubicacion,
        avatar: datos.avatar,
      });
    } catch (err) {
      console.error("Error al actualizar el perfil:", err);
      setError("No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>Editar planeta</h3>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-field">
            <label>Nombre del planeta</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Tierra, Kepler-22b..."
            />
          </div>

          <div className="edit-field">
            <label>Biografía</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale al cosmos sobre tu planeta..."
              rows={3}
            />
          </div>

          <div className="edit-field">
            <label>Ubicación</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Vía Láctea, Sistema Solar"
            />
          </div>

          <div className="edit-field">
            <label>Avatar (URL de imagen)</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && <p className="edit-modal-error">{error}</p>}

          <div className="edit-modal-actions">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
