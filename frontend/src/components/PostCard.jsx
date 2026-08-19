import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getCommentsByPost, createComment } from "../services/commentService";
import { incrementarComentarios, incrementarShares } from "../services/postService";
import { createRepost, getUltimoRepost } from "../services/repostService";
import { usuarioActivo } from "../mocks/demoUsers";
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
}) => {
  const [liked, setLiked] = useState(false);
  const [destellosCount, setDestallosCount] = useState(destellosNum);
  const [shareCount, setShareCount] = useState(sharesNum);

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

  // Al montar el componente, revisa si ya hay un cooldown activo de un repost anterior
  useEffect(() => {
    const revisarCooldown = async () => {
      const ultimoRepost = await getUltimoRepost(id, usuarioActivo.authorId);
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
  }, []);

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

  const handleShares = async () => {
    if (compartiendo || segundosRestantes > 0) return; // bloqueado mientras carga o en cooldown

    setCompartiendo(true);
    try {
      await createRepost({
        originalPostId: id,
        repostedBy: usuarioActivo.authorId,
        nombre: usuarioActivo.nombre,
        handle: usuarioActivo.handle,
        avatar: usuarioActivo.avatar,
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

  const handleDestello = () => {
    if (liked) {
      setLiked(false);
      setDestallosCount(destallosCount - 1);
    } else {
      setLiked(true);
      setDestallosCount(destallosCount + 1);
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
    if (nuevoComentario.trim() === "") return;
    try {
      await createComment({
        postId: id,
        text: nuevoComentario.trim(),
        authorId: usuarioActivo.authorId,
        nombre: usuarioActivo.nombre,
        handle: usuarioActivo.handle,
        avatar: usuarioActivo.avatar,
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
      {authorId ? (
        <Link to={`/perfil/${authorId}`} className="header header-link">
          <div className="avatar" style={{ backgroundColor: avatar }}></div>
          <div className="info">
            <div className="nombrePlanet">{nombre}</div>
            <div className="infoPublish">
              <span>@{handle} ● {timePublished(timeAgo)}</span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="header">
          <div className="avatar" style={{ backgroundColor: avatar }}></div>
          <div className="info">
            <div className="nombrePlanet">{nombre}</div>
            <div className="infoPublish">
              <span>@{handle} ● {timePublished(timeAgo)}</span>
            </div>
          </div>
        </div>
      )}
      <div className="description">{description}</div>
      {image && (
        <div className="imgPost">
          <img src={image} alt="Imagen del post" loading="lazy" />
        </div>
      )}
      <div className="options">
        <button className={`btnDestellos ${liked ? "active" : ""}`} onClick={handleDestello}>
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
    </div>
  );
};

export default PostCard;