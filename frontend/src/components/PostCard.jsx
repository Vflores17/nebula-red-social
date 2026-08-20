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
import { getProfileById, getProfileByIdCached } from "../services/userService";
import ConfirmModal from "./ConfirmModal";
import { getVimeoId, getYoutubeId, parseHttpUrl } from "../utils/linkParser";
import "./PostCard.css";

const COOLDOWN_SEGUNDOS = 30; // tiempo de espera entre retransmisiones del mismo post

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
}) => {
  const { user, userProfile } = useAuth();
  const esPropio = user?.uid === authorId;
  const [liked, setLiked] = useState(false);
  const [likeDocId, setLikeDocId] = useState(null);
  const [procesandoLike, setProcesandoLike] = useState(true);
  const [destellosCount, setDestallosCount] = useState(destellosNum || 0);
  const [shareCount, setShareCount] = useState(sharesNum);
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
  const youtubeId = linkUrl ? getYoutubeId(linkUrl) : null;
  const vimeoId = linkUrl ? getVimeoId(linkUrl) : null;
  const parsedLink = linkUrl ? parseHttpUrl(linkUrl) : null;

  // --- Estado de comentarios ---
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [contadorComentarios, setContadorComentarios] = useState(commentsNum);

  // --- Estado nuevo para retransmitir ---
  const [compartiendo, setCompartiendo] = useState(false); 
  const [segundosRestantes, setSegundosRestantes] = useState(0); 
  const intervalRef = useRef(null); 

  const iniciarCooldown = (segundosIniciales) => {
    setSegundosRestantes(segundosIniciales);

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
  }, [id, user]);

  useEffect(() => {
    const revisarCooldown = async () => {
      if (!user) return;
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
  }, [id, user]);

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
          <div className="avatar">
            <img src={autorActual.avatar || "/fallback-avatar.png"} alt="Avatar" />
          </div>
        </Link>
        <div className="info">
          <Link to={`/profile/${authorId}`} className="nombrePlanet">
            <strong>{autorActual.nombre}</strong>
          </Link>
          <span className="handle">@{autorActual.handle}</span>
          <span className="time">• {timeAgo}</span>
          {visibility === "private" && <span className="post-private-badge">🔒 Privado</span>}
        </div>

        {esPropio && (
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

        {image && (
          <div className="imgPost">
            <img src={image} alt="Post Content" />
          </div>
        )}

        {youtubeId && (
          <div className="post-video-embed">
            <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" allowFullScreen></iframe>
          </div>
        )}

        {vimeoId && (
          <div className="post-video-embed">
            <iframe src={`https://player.vimeo.com/video/${vimeoId}`} title="Vimeo video player" allowFullScreen></iframe>
          </div>
        )}

        {parsedLink && !youtubeId && !vimeoId && (
          <a href={parsedLink} target="_blank" rel="noopener noreferrer" className="post-link-preview">
            <span className="post-link-url">{parsedLink}</span>
          </a>
        )}
      </div>

      {errorAccion && <p className="post-error">{errorAccion}</p>}

      <div className="options">
        <button className={`btnDestellos ${liked ? "active" : ""}`} onClick={handleDestello} disabled={procesandoLike}>
          ✨ {destellosCount}
        </button>
        <button className="btnComments" onClick={toggleComentarios}>
          💬 {contadorComentarios}
        </button>
        <button className="btnShares" onClick={handleShares} disabled={compartiendo || segundosRestantes > 0}>
          🚀 {segundosRestantes > 0 ? `${segundosRestantes}s` : shareCount}
        </button>
      </div>

      {mostrarComentarios && (
        <div className="comments-panel">
          <form className="comments-input-row" onSubmit={handleEnviarComentario}>
            <input type="text" placeholder="Escribe un comentario..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} />
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

      {mostrarConfirmGuardar && (
        <ConfirmModal title="Confirmar Edición" message="¿Estás seguro de guardar los cambios en esta publicación?" onConfirm={handleConfirmarGuardar} onCancel={() => setMostrarConfirmGuardar(false)} />
      )}

      {mostrarConfirmEliminar && (
        <ConfirmModal title="Eliminar Publicación" message="¿Estás seguro de borrar este elemento permanentemente?" onConfirm={handleConfirmarEliminar} onCancel={() => setMostrarConfirmEliminar(false)} />
      )}
    </div>
  );
};

export default PostCard;