import { useState, useRef } from "react";
import { createPost } from "../services/postService";
import { uploadImage } from "../services/cloudinaryService";
import { useAuth } from "../context/AuthContext";
import { parseHttpUrl } from "../utils/linkParser";
import ConfirmModal from "./ConfirmModal";
import "./Composer.css";

const Composer = ({ onPostCreado }) => {
  const { user, userProfile } = useAuth();
  const [texto, setTexto] = useState("");
  const [imagenFile, setImagenFile] = useState(null); // el archivo real seleccionado
  const [previewUrl, setPreviewUrl] = useState(null); // preview local, antes de subir
  const [visibility, setVisibility] = useState("public");
  const [mostrarLink, setMostrarLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [errorPublicacion, setErrorPublicacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef(null); // para "clickear" el input escondido

  const handleSeleccionarImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagenFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // vista previa temporal
  };

  const handleQuitarImagen = () => {
    setImagenFile(null);
    setPreviewUrl(null);
  };

  const handleTransmitir = async () => {
    const linkLimpio = linkUrl.trim();
    const linkNormalizado = linkLimpio ? parseHttpUrl(linkLimpio) : null;

    if (linkLimpio && !linkNormalizado) {
      setErrorPublicacion("Ingresa una URL válida que comience con http:// o https://.");
      return;
    }

    if ((!texto.trim() && !imagenFile && !linkNormalizado) || !user || !userProfile) return;

    setEnviando(true);
    try {
      let imageUrl = null;

      if (imagenFile) {
        imageUrl = await uploadImage(imagenFile); // sube a Cloudinary y espera la URL
      }

      await createPost({
        description: texto.trim(),
        image: imageUrl,
        authorId: user.uid,
        nombre: userProfile.nombrePlaneta || userProfile.nombre || user.displayName || "Usuario",
        handle: userProfile.handle || userProfile.username || userProfile.nombrePlaneta || "usuario",
        avatar: userProfile.avatar || "",
        visibility,
        linkUrl: linkNormalizado,
      });

      // limpia todo después de publicar
      setTexto("");
      setImagenFile(null);
      setPreviewUrl(null);
      setVisibility("public");
      setLinkUrl("");
      setMostrarLink(false);
      onPostCreado?.();
    } catch (error) {
      console.error("Error al publicar:", error);
      setErrorPublicacion("No se pudo publicar la transmisión. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card-composer">
      <div className="card-logo">🌍</div>
      <div className="card-textArea-btn">
        <textarea
          placeholder="¿Que descubriste en el cosmos hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        {previewUrl && (
          <div className="composer-preview">
            <img src={previewUrl} alt="Preview" />
            <button
              type="button"
              className="composer-preview-remove"
              onClick={handleQuitarImagen}
            >
              ✕
            </button>
          </div>
        )}

        {mostrarLink && (
          <input
            type="url"
            className="composer-link-input"
            placeholder="https://youtube.com/watch?v=..."
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            disabled={enviando}
            autoFocus
          />
        )}

        <div className="card-footer">
          {/* input real, escondido con CSS */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleSeleccionarImagen}
            style={{ display: "none" }}
          />

          {/* botón visible que "activa" el input escondido */}
          <div className="composer-footer-tools">
            <button
              type="button"
              className="card-import"
              aria-label="Adjuntar imagen"
              onClick={() => fileInputRef.current?.click()}
              disabled={enviando}
            >
              📎
            </button>
            <button
              type="button"
              className="card-import"
              aria-label="Agregar enlace"
              aria-expanded={mostrarLink}
              onClick={() => setMostrarLink((visible) => !visible)}
              disabled={enviando}
            >
              🔗
            </button>
            <select
              className="composer-visibility"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              aria-label="Visibilidad de la publicación"
              disabled={enviando}
            >
              <option value="public">🌍 Público</option>
              <option value="private">🔒 Privado</option>
            </select>
          </div>

          <button onClick={handleTransmitir} disabled={enviando || !userProfile}>
            {enviando ? "Transmitiendo..." : "Transmitir ➤"}
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(errorPublicacion)}
        title="No se pudo publicar"
        message={errorPublicacion}
        confirmLabel="Entendido"
        cancelLabel=""
        onConfirm={() => setErrorPublicacion("")}
        onClose={() => setErrorPublicacion("")}
      />
    </div>
  );
};

export default Composer;
