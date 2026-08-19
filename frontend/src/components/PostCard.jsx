import { useState, useEffect, useRef } from "react";
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
  timeAgo,
  destellosNum,
  commentsNum,
  sharesNum,
  visibility,
  onPostEliminado,
}) => {
  const { user, userProfile } = useAuth();
  const esPropio = user?.uid === authorId;
  const puedeReportar = Boolean(user && authorId && !esPropio);
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
  const [reporteTarget, setReporteTarget] = useState(null);

  // --- Estado de comentarios (ya lo tenías) ---
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [contadorComentarios, setContadorComentarios] = useState(commentsNum);

  // --- Estado nuevo para retransmitir ---
  const [compartiendo, setCompartiendo] = useState(false); // mientras se guarda en Firestore
  const [segundosRestantes, setSegundosRestantes] = useState(0); // cooldown activo
  const intervalRef = useRef(null); // para poder limpiar el setInterval del cooldown

  /**
   * Arranca (o reanuda) la cuenta regresiva visual del cooldown.
   */
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
        // Los posts huérfanos conservan sus datos embebidos como fallback.
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

  // Al montar el componente, revisa si ya hay un cooldown activo de un repost anterior
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

    // limpieza: si el componente se desmonta, detiene el contador para no dejarlo corriendo en el vacío
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
      iniciarCooldown(COOLDOWN_SEGUNDOS); // arranca el cooldown recién creado
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
        // Otra pestaña pudo crear el like después de la consulta inicial.
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

  const handleSolicitarGuardar = () => {
    const nuevoTexto = descripcionEditada.trim();
    if (!nuevoTexto) {
      setErrorEdicion("La publicación no puede quedar vacía.");
      return;
    }

    setErrorEdicion("");
    setMostrarConfirmGuardar(true);
  };

  const handleConfirmarGuardar = async () => {
    const nuevoTexto = descripcionEditada.trim();
    setGuardandoEdicion(true);
    setErrorEdicion("");
    try {
      await updatePost(id, { description: nuevoTexto });
      setDescripcionActual(nuevoTexto);
      setDescripcionEditada(nuevoTexto);
      setEditando(false);
      setMostrarConfirmGuardar(false);
    } catch (error) {
      console.error("Error al editar la publicación:", error);
      setMostrarConfirmGuardar(false);
      setErrorAccion("No se pudo guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleSolicitarEliminar = () => {
    setMenuAbierto(false);
    setMostrarConfirmEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    setEliminando(true);
    try {
      await deletePost(id);
      setMostrarConfirmEliminar(false);
      onPostEliminado?.(id);
    } catch (error) {
      console.error("Error al eliminar la publicación:", error);
      setMostrarConfirmEliminar(false);
      setErrorAccion("No se pudo eliminar la publicación. Inténtalo de nuevo.");
    } finally {
      setEliminando(false);
    }
  };

  const convertNum = (num) => {
    if (num > 1000000) return (num / 1000000).toFixed(1) + " M ";
    if (num > 1000) return (num / 1000).toFixed(1) + " K ";
    return num;
  };

  const timePublished = (timeAgo) => {
    const ahora = new Date();
    const diferenciaMs = ahora - timeAgo;
    const minutos = Math.floor(diferenciaMs / (1000 * 60));
    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    if (dias >= 1) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
    if (horas >= 1) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
    return `Hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  };

  const cargarComentarios = async () => {
    setCargandoComentarios(true);
    try {
      const snapshot = await getCommentsByPost(id);
      setComentarios(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const handleToggleComentarios = () => {
    const seVaAAbrir = !mostrarComentarios;
    setMostrarComentarios(seVaAAbrir);
    if (seVaAAbrir && comentarios.length === 0) cargarComentarios();
  };

  const handleEnviarComentario = async () => {
    if (nuevoComentario.trim() === "" || !user || !userProfile) return;
    try {
      await createComment({
        postId: id,
        text: nuevoComentario.trim(),
        authorId: user.uid,
        nombre: userProfile.nombrePlaneta,
        handle: userProfile.handle || userProfile.username || userProfile.nombrePlaneta,
        avatar: userProfile.avatar || "",
      });
      await incrementarComentarios(id);
      setNuevoComentario("");
      setContadorComentarios((prev) => prev + 1);
      cargarComentarios();
    } catch (error) {
      console.error("Error al comentar:", error);
    }
  };

  return (
    <div className="card-post">
      <div className="header">
        <div className="avatar" style={{ backgroundColor: autorActual.avatar }}>
          {autorActual.avatar?.startsWith?.("http") && (
            <img src={autorActual.avatar} alt={`Avatar de ${autorActual.nombre}`} />
          )}
        </div>
        <div className="info">
          <div className="nombrePlanet">{autorActual.nombre}</div>
          <div className="infoPublish">
            <span>
              @{autorActual.handle} ● {timePublished(timeAgo)}
              {visibility === "private" && (
                <span className="post-private-badge" title="Publicación privada">
                  🔒 Privado
                </span>
              )}
            </span>
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
        </div>
        {esPropio && (
          <div className="post-owner-menu">
            <button
              type="button"
              className="post-menu-trigger"
              aria-label="Opciones de la publicación"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              disabled={eliminando}
            >
              ⋯
            </button>
            {menuAbierto && (
              <div className="post-menu-options">
                <button type="button" onClick={handleEditar}>Editar</button>
                <button type="button" className="delete-option" onClick={handleSolicitarEliminar}>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {editando ? (
        <div className="post-edit-form">
          <textarea
            value={descripcionEditada}
            onChange={(event) => setDescripcionEditada(event.target.value)}
            disabled={guardandoEdicion}
            autoFocus
          />
          {errorEdicion && <p className="post-edit-error">{errorEdicion}</p>}
          <div className="post-edit-actions">
            <button type="button" onClick={handleSolicitarGuardar} disabled={guardandoEdicion}>
              {guardandoEdicion ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={handleCancelarEdicion} disabled={guardandoEdicion}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="description">{descripcionActual}</div>
      )}
      {image && (
        <div className="imgPost">
          <img src={image} alt="Imagen del post" loading="lazy" />
        </div>
      )}
      <div className="options">
        <button
          className={`btnDestellos ${liked ? "active" : ""}`}
          onClick={handleDestello}
          disabled={procesandoLike || !user}
          aria-pressed={liked}
        >
          💫 {convertNum(destellosCount)}
        </button>
        <button className="btnComments" onClick={handleToggleComentarios}>
          💬 {convertNum(contadorComentarios)}
        </button>
        <button
          className="btnShares"
          onClick={handleShares}
          disabled={compartiendo || segundosRestantes > 0}
        >
          📡 {convertNum(shareCount)}
          {segundosRestantes > 0 && <span className="cooldown-text"> ({segundosRestantes}s)</span>}
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

      {mostrarComentarios && (
        <div className="comments-panel">
          <div className="comments-input-row">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnviarComentario()}
            />
            <button onClick={handleEnviarComentario}>Enviar</button>
          </div>

          {cargandoComentarios ? (
            <p className="comments-loading">Cargando comentarios...</p>
          ) : comentarios.length === 0 ? (
            <p className="comments-empty">Sé el primero en comentar</p>
          ) : (
            <ul className="comments-list">
              {comentarios.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-avatar" style={{ backgroundColor: c.avatar }}></div>
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

      <ConfirmModal
        isOpen={Boolean(errorAccion)}
        title="No se pudo completar la acción"
        message={errorAccion}
        confirmLabel="Entendido"
        cancelLabel=""
        onConfirm={() => setErrorAccion("")}
        onClose={() => setErrorAccion("")}
      />

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
