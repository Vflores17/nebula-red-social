import { useState, useRef } from "react";
import { createPost } from "../services/postService";
import { uploadImage } from "../services/cloudinaryService";
import "./Composer.css";
import {usuarioActivo } from "../mocks/demoUsers";

const Composer = ({ onPostCreado }) => {
  const [texto, setTexto] = useState("");
  const [imagenFile, setImagenFile] = useState(null); // el archivo real seleccionado
  const [previewUrl, setPreviewUrl] = useState(null); // preview local, antes de subir
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
    if (texto.trim() === "" && !imagenFile) return; // no publiques posts vacíos

    setEnviando(true);
    try {
      let imageUrl = null;

      if (imagenFile) {
        imageUrl = await uploadImage(imagenFile); // sube a Cloudinary y espera la URL
      }

      await createPost({
        description: texto.trim(),
        image: imageUrl,
        ...usuarioActivo,
      });

      // limpia todo después de publicar
      setTexto("");
      setImagenFile(null);
      setPreviewUrl(null);
      onPostCreado?.();
    } catch (error) {
      console.error("Error al publicar:", error);
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
          <div
            className="card-import"
            onClick={() => fileInputRef.current.click()}
          >
            📎
          </div>

          <button onClick={handleTransmitir} disabled={enviando}>
            {enviando ? "Transmitiendo..." : "Transmitir ➤"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;