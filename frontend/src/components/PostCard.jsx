import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getCommentsByPost, createComment } from "../services/commentService";
import {
  deletePost,
  decrementarDestellos,
  incrementarComentarios,
  incrementarDestellos,
  incrementarShares,
  updatePost,
} from "../services/postService";
import {
  getLikeByPostAndUser,
  likePost,
  unlikePost,
} from "../services/likeService";
import { createRepost, getUltimoRepost } from "../services/repostService";
import { useAuth } from "../context/AuthContext";
import { getProfileByIdCached } from "../services/userService";
import ConfirmModal from "./ConfirmModal";
import ReportModal from "./ReportModal";
import { getVimeoId, getYoutubeId, parseHttpUrl } from "../utils/linkParser";
import "./PostCard.css";

const COOLDOWN_SEGUNDOS = 30;

const PostCard = ({
  id,
  authorId,
  nombre,
  handle,
  avatar,
  description,
  image,
  linkUrl,
  timeAgo,
  destellosNum,
  commentsNum,
  sharesNum,
  visibility,
  onPostEliminado,
  modoSoloLectura = false,
}) => {
  const { user, userProfile } = useAuth();
  const esPropio = user?.uid === authorId;
  const puedeReportar = Boolean(user && authorId && !esPropio);
  
  const [liked, setLiked] = useState(false);
  const [likeDocId, setLikeDocId] = useState(null);
  const [procesandoLike, setProcesandoLike] = useState(true);
  const [destellosCount, setDestallosCount] = useState(destellosNum || 0);
  const [shareCount, setShareCount] = useState(sharesNum || 0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [descripcionActual, setDescripcionActual] = useState(description);
  const [descripcionEditada, setDescripcionEditada] = useState(description);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarConfirmGuardar, setMostrarConfirmGuardar] = useState(false);
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  const [autorActual, setAutorActual] = useState({ nombre, handle, avatar });
  const [reporteTarget, setReporteTarget] = useState(null);

  const youtubeId = linkUrl ? getYoutubeId(linkUrl) : null;
  const vimeoId = linkUrl ? getVimeoId(linkUrl) : null;
  const parsedLink = linkUrl ? parseHttpUrl(linkUrl) : null;

  // --- Estado de comentarios ---
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [contadorComentarios, setContadorComentarios] = useState(commentsNum || 0);

  // --- Cooldown para retransmitir ---
  const [compartiendo, setCompartiendo] = useState(false); 
  const [segundosRestantes, setSegundosRestantes] = useState(0); 
  const intervalRef = useRef(null); 

  const iniciarCooldown = (segundosIniciales) => {
    setSegundosRestantes(segundosIniciales);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let activo = true;
    const cargarAutorActual = async () => {
      try {
        const perfil = await getProfileByIdCached(authorId);
        if (!activo || !perfil) return;

        setAutorActual({
          nombre: perfil.nombrePlaneta || perfil.nombre || nombre,
          handle: perfil.handle || perfil.username || perfil.nombrePlaneta || handle,
          avatar: perfil.avatar || avatar,
        });
      } catch (error) {
        console.error("Error al cargar el autor actual del post:", error);
      }
    };

    cargarAutorActual();
    return () => { activo = false; };
  }, [authorId, nombre, handle, avatar]);

  useEffect(() => {
    let activo = true;

    const cargarLike = async () => {
      if (modoSoloLectura) {
        if (activo) setProcesandoLike(false);
        return;
      }

      if (!user) {
        if (activo) {
          setLiked(false);
          setLikeDocId(null);
          setProcesandoLike(false);
        }
        return;
      }

      setProcesandoLike(true);
      try {
        const likeExistente = await getLikeByPostAndUser(id, user.uid);
        if (!activo) return;

        setLiked(Boolean(likeExistente));
        setLikeDocId(likeExistente?.id || null);
      } catch (error) {
        console.error("Error al consultar el like:", error);
        if (activo) {
          setErrorAccion("No se pudo consultar el estado de tus destellos.");
        }
      } finally {
        if (activo) setProcesandoLike(false);
      }
    };

    cargarLike();
    return () => { activo = false; };
  }, [id, user, modoSoloLectura]);

  useEffect(() => {
    const revisarCooldown = async () => {
      if (!user || modoSoloLectura) return;
      const ultimoRepost = await getUltimoRepost(id, user.uid);
      if (!ultimoRepost || !ultimoRepost.createdAt) return;

      const segundosDesdeRepost = Math.floor(
        (Date.now() - ultimoRepost.createdAt.toDate().getTime()) / 1000
      );
      const restante = COOLDOWN_SEGUNDOS - segundosDesdeRepost;

      if (restante > 0) {
        iniciarCooldown(restante);
      }
    };

    revisarCooldown();
    return () => clearInterval(intervalRef.current);
  }, [id, user, modoSoloLectura]);

  const handleShares = async () => {
    if (compartiendo || segundosRestantes > 0 || !user || !userProfile) return;

    setCompartiendo(true);
    try {
      await createRepost({
        originalPostId: id,
        repostedBy: user.uid,
        nombre: userProfile.nombrePlaneta,
        handle: userProfile.handle || userProfile.username || userProfile.nombrePlaneta,
        avatar: userProfile.avatar || "",
      });

      await incrementarShares(id);
      setShareCount((prev) => prev + 1);
      iniciarCooldown(COOLDOWN_SEGUNDOS);
    } catch (error) {
      console.error("Error al retransmitir:", error);
    } finally {
      setCompartiendo(false);
    }
  };

  const handleDestello = async () => {
    if (!user || procesandoLike) return;

    setProcesandoLike(true);
    try {
      if (liked) {
        if (!likeDocId) throw new Error("No se encontró el documento del like.");
        await unlikePost(likeDocId);
        await decrementarDestellos(id);
        setLiked(false);
        setLikeDocId(null);
        setDestallosCount((prev) => Math.max(0, prev - 1));
      } else {
        const likeExistente = await getLikeByPostAndUser(id, user.uid);
        if (likeExistente) {
          setLiked(true);
          setLikeDocId(likeExistente.id);
          return;
        }

        const nuevoLike = await likePost(id, user.uid);
        await incrementarDestellos(id);
        setLiked(true);
        setLikeDocId(nuevoLike.id);
        setDestallosCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error al cambiar el like:", error);
      setErrorAccion("No se pudo actualizar tu destello. Inténtalo de nuevo.");
    } finally {
      setProcesandoLike(false);
    }
  };

  const handleEditar = () => {
    setDescripcionEditada(descripcionActual);
    setErrorEdicion("");
    setEditando(true);
    setMenuAbierto(false);
  };

  const handleCancelarEdicion = () => {
    setDescripcionEditada(descripcionActual);
    setErrorEdicion("");
    setEditando(false);
  };

  const handleConfirmarGuardar = async () => {
    const nuevoTexto = descripcionEditada.trim();
    if (!nuevoTexto) {
      setErrorEdicion("La publicación no puede quedar vacía.");
      return;
    }

    setGuardandoEdicion(true);
    try {
      await updatePost(id, { description: nuevoTexto });
      setDescripcionActual(nuevoTexto);
      setEditando(false);
    } catch (error) {
      console.error("Error al editar el post:", error);
      setErrorEdicion("Ocurrió un error al guardar los cambios.");
    } finally {
      setGuardandoEdicion(false);
      setMostrarConfirmGuardar(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setEliminando(true);
    try {
      await deletePost(id);
      if (onPostEliminado) onPostEliminado(id);
    } catch (error) {
      console.error("Error al eliminar el post:", error);
      setErrorAccion("No se pudo eliminar la publicación.");
    } finally {
      setEliminando(false);
      setMostrarConfirmEliminar(false);
    }
  };

  const toggleComentarios = async () => {
    if (!mostrarComentarios) {
      setCargandoComentarios(true);
      try {
        const res = await getCommentsByPost(id);
        setComentarios(res || []);
      } catch (error) {
        console.error("Error al cargar comentarios:", error);
      } finally {
        setCargandoComentarios(false);
      }
    }
    setMostrarComentarios(!mostrarComentarios);
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !user) return;

    try {
      const nuevo = await createComment(id, user.uid, nuevoComentario.trim(), {
        nombre: userProfile?.nombrePlaneta || user.displayName || "Usuario",
        avatar: userProfile?.avatar || ""
      });
      setComentarios((prev) => [...prev, nuevo]);
      setNuevoComentario("");
      await incrementarComentarios(id);
      setContadorComentarios((prev) => prev + 1);
    } catch (error) {
      console.error("Error al crear comentario:", error);
    }
  };

  return (
    <div className="card-post">
      <div className="header">
        <Link to={`/profile/${authorId}`} className="header-link">
          <div 
            className="avatar" 
            style={{ backgroundColor: !autorActual.avatar?.startsWith("http") ? autorActual.avatar : "transparent" }}
          >
            <img 
              src={autorActual.avatar?.startsWith("http") ? autorActual.avatar : "/fallback-avatar.png"} 
              alt={`Avatar de ${autorActual.nombre}`} 
            />
          </div>
        </Link>

        <div className="info">
          <Link to={`/profile/${authorId}`} className="nombrePlanet">
            <strong>{autorActual.nombre}</strong>
          </Link>
          <span className="handle">@{autorActual.handle}</span>
          <span className="time">• {timeAgo}</span>
          {visibility === "private" && (
            <span className="post-private-badge" title="Publicación privada">
              🔒 Privado
            </span>
          )}
          {puedeReportar && (
            <button
              type="button"
              className="report-author-button"
              aria-label={`Reportar al autor ${autorActual.nombre}`}
              title="Reportar autor"
              onClick={() => setReporteTarget({ type: "user", id: authorId })}
            >
              🚩
            </button>
          )}
        </div>

        {esPropio && !modoSoloLectura && (
          <div className="post-owner-menu">
            <button className="post-menu-trigger" onClick={() => setMenuAbierto(!menuAbierto)}>⋮</button>
            {menuAbierto && (
              <div className="post-menu-options">
                <button onClick={handleEditar}>Editar</button>
                <button className="delete-option" onClick={() => setMostrarConfirmEliminar(true)}>Eliminar</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="content" style={{ width: "100%" }}>
        {editando ? (
          <div className="post-edit-form">
            <textarea value={descripcionEditada} onChange={(e) => setDescripcionEditada(e.target.value)} />
            {errorEdicion && <p className="post-edit-error">{errorEdicion}</p>}
            <div className="post-edit-actions">
              <button onClick={() => setMostrarConfirmGuardar(true)} disabled={guardandoEdicion}>Guardar</button>
              <button onClick={handleCancelarEdicion}>Cancelar</button>
            </div>
          </div>
        ) : (
          <p className="description">{descripcionActual}</p>
        )}

        {youtubeId ? (
          <div className="post-video-embed">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Video de YouTube"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : vimeoId ? (
          <div className="post-video-embed">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title="Video de Vimeo"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : parsedLink ? (
          <a
            href={typeof parsedLink === "string" ? parsedLink : parsedLink.href}
            target="_blank"
            rel="noreferrer"
            className="post-link-preview"
          >
            <span className="post-link-url">
              {typeof parsedLink === "string" ? parsedLink : parsedLink.href}
            </span>
          </a>
        ) : null}

        {image && (
          <div className="imgPost">
            <img src={image} alt="Imagen de la publicación" loading="lazy" />
          </div>
        )}
      </div>

      {!modoSoloLectura && (
        <div className="options">
          <button
            className={`btnDestellos ${liked ? "active" : ""}`}
            onClick={handleDestello}
            disabled={procesandoLike || !user}
            aria-pressed={liked}
          >
            ✨ {destellosCount}
          </button>
          <button className="btnComments" onClick={toggleComentarios}>
            💬 {contadorComentarios}
          </button>
          <button className="btnShares" onClick={handleShares} disabled={compartiendo || segundosRestantes > 0}>
            🚀 {segundosRestantes > 0 ? `${segundosRestantes}s` : shareCount}
          </button>
          {puedeReportar && (
            <button
              type="button"
              className="btnReport"
              onClick={() => setReporteTarget({ type: "post", id })}
            >
              🚩 Reportar
            </button>
          )}
        </div>
      )}

      {mostrarComentarios && (
        <div className="comments-panel">
          <form className="comments-input-row" onSubmit={handleEnviarComentario}>
            <input 
              type="text" 
              placeholder="Escribe un comentario..." 
              value={nuevoComentario} 
              onChange={(e) => setNuevoComentario(e.target.value)} 
            />
            <button type="submit">Enviar</button>
          </form>

          {cargandoComentarios ? (
            <div className="comments-loading">Cargando comentarios...</div>
          ) : comentarios.length === 0 ? (
            <div className="comments-empty">No hay comentarios aún.</div>
          ) : (
            <ul className="comments-list">
              {comentarios.map((c) => (
                <li key={c.id} className="comment-item">
                  <img className="comment-avatar" src={c.avatar || "/fallback-avatar.png"} alt="avatar" />
                  <div className="comment-content">
                    <span className="comment-nombre">{c.nombre}</span>
                    <span className="comment-text">{c.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modales de Confirmación */}
      <ConfirmModal
        isOpen={mostrarConfirmGuardar}
        title="¿Guardar cambios?"
        message="Se actualizará el texto de esta publicación."
        confirmLabel="Guardar"
        loading={guardandoEdicion}
        onConfirm={handleConfirmarGuardar}
        onClose={() => setMostrarConfirmGuardar(false)}
      />

      <ConfirmModal
        isOpen={mostrarConfirmEliminar}
        title="¿Eliminar publicación?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
        onConfirm={handleConfirmarEliminar}
        onClose={() => setMostrarConfirmEliminar(false)}
      />

      {errorAccion && (
        <ConfirmModal
          isOpen={Boolean(errorAccion)}
          title="No se pudo completar la acción"
          message={errorAccion}
          confirmLabel="Entendido"
          cancelLabel=""
          onConfirm={() => setErrorAccion("")}
          onClose={() => setErrorAccion("")}
        />
      )}

      {reporteTarget && (
        <ReportModal
          targetType={reporteTarget.type}
          targetId={reporteTarget.id}
          onClose={() => setReporteTarget(null)}
        />
      )}
    </div>
  );
};

export default PostCard;