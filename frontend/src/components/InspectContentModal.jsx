import { useEffect, useState } from "react";
import { getById as getPostById } from "../services/postService";
import { getById as getUserById } from "../services/userService";
import PostCard from "./PostCard";
import "./InspectContentModal.css";

const InspectContentModal = ({ targetType, targetId, onClose }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const document = targetType === "post"
          ? await getPostById(targetId)
          : await getUserById(targetId);
        if (!active) return;

        setContent(document ? { id: document.id, ...document.data() } : null);
      } catch (loadError) {
        console.error("Error al inspeccionar el contenido reportado:", loadError);
        if (active) setError("No se pudo cargar el contenido reportado.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContent();
    return () => { active = false; };
  }, [targetId, targetType]);

  const renderContent = () => {
    if (loading) return <p className="inspect-content-state">Cargando contenido...</p>;
    if (error) return <p className="inspect-content-error" role="alert">{error}</p>;

    if (!content) {
      return (
        <p className="inspect-content-state">
          {targetType === "post"
            ? "Esta publicación ya no existe."
            : "Este usuario ya no existe."}
        </p>
      );
    }

    if (targetType === "post") {
      return (
        <div className="inspect-post-wrapper">
          <PostCard
            {...content}
            timeAgo={content.createdAt?.toDate?.() || new Date()}
            modoSoloLectura
          />
        </div>
      );
    }

    const displayName = content.nombrePlaneta || content.nombre || "Usuario sin nombre";
    const handle = content.handle || content.username || content.nombrePlaneta;
    const avatarIsImage = content.avatar?.startsWith?.("http");

    return (
      <div className="inspect-user-summary">
        <div className="inspect-user-avatar" style={{ backgroundColor: avatarIsImage ? undefined : content.avatar }}>
          {avatarIsImage && <img src={content.avatar} alt={`Avatar de ${displayName}`} />}
        </div>
        <div className="inspect-user-details">
          <h3>{displayName}</h3>
          {handle && <p className="inspect-user-handle">@{handle}</p>}
          <p>{content.biografia || content.bio || "Este usuario no tiene biografía."}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="inspect-modal-overlay" onClick={onClose}>
      <div
        className="inspect-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspect-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="inspect-modal-title">
          👁️ Ver {targetType === "post" ? "publicación" : "usuario"}
        </h2>
        <div className="inspect-modal-body">{renderContent()}</div>
        <div className="inspect-modal-actions">
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default InspectContentModal;
