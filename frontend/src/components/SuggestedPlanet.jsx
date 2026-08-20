import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import {
  enviarSolicitud,
  obtenerEstado,
  aceptarSolicitud,
} from "../services/friendshipService";
import "./SuggestedPlanet.css";

// uid: id real (Firestore) del usuario que representa esta tarjeta.
// Si no se pasa uid (p. ej. datos mock sin uid), el botón queda deshabilitado
// en vez de fingir una acción que no se guarda en ningún lado.
const SuggestedPlanet = ({
  uid,
  nombre,
  handle,
  avatar,
  bio,
  satelites,
  orbitando,
}) => {
  const [relacion, setRelacion] = useState(null); // null | {estado, esSolicitante, id}
  const [cargando, setCargando] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !currentUserId || uid === currentUserId) return;

    obtenerEstado(currentUserId, uid).then(setRelacion).catch(console.error);
  }, [uid, currentUserId]);

  const handleClick = async () => {
    if (!uid || !currentUserId || cargando) return;
    setCargando(true);
    try {
      if (!relacion) {
        // No hay relación todavía: enviar solicitud
        await enviarSolicitud(currentUserId, uid);
        setRelacion({ estado: "pendiente", esSolicitante: true });
      } else if (relacion.estado === "pendiente" && !relacion.esSolicitante) {
        // Yo soy el receptor de una solicitud pendiente: aceptarla
        await aceptarSolicitud(relacion);
        setRelacion({ ...relacion, estado: "aceptada" });
      }
      // Si ya está "pendiente" (yo la envié) o "aceptada", el botón no hace nada más aquí.
    } catch (err) {
      alert(err.message || "No se pudo completar la acción");
    } finally {
      setCargando(false);
    }
  };

  const textoBoton = () => {
    if (!uid) return "Orbitar"; // dato mock, sin conexión real
    if (!relacion) return "Orbitar";
    if (relacion.estado === "aceptada") return "Orbitando";
    if (relacion.estado === "pendiente" && relacion.esSolicitante) return "Solicitud enviada";
    if (relacion.estado === "pendiente" && !relacion.esSolicitante) return "Aceptar solicitud";
    if (relacion.estado === "rechazada") return "Orbitar";
    return "Orbitar";
  };

  const deshabilitado =
    cargando ||
    !uid ||
    uid === currentUserId ||
    (relacion?.estado === "pendiente" && relacion.esSolicitante) ||
    relacion?.estado === "aceptada";

  return (
    <div className="card-planet">
      {uid ? (
        <Link to={`/perfil/${uid}`} className="card-left card-left-link">
          <div className="avatar" style={{ backgroundColor: avatar }}></div>
          <div className="info">
            <div className="nombre">{nombre}</div>
            <div className="handle">@{handle}</div>
            <div className="bio">{bio}</div>
            <div className="stats">
              <div className="satelites">{satelites} <span>Satélites</span> </div>
              <div className="orbitando">{orbitando} <span>orbitando</span></div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="card-left">
          <div className="avatar" style={{ backgroundColor: avatar }}></div>
          <div className="info">
            <div className="nombre">{nombre}</div>
            <div className="handle">@{handle}</div>
            <div className="bio">{bio}</div>
            <div className="stats">
              <div className="satelites">{satelites} <span>Satélites</span> </div>
              <div className="orbitando">{orbitando} <span>orbitando</span></div>
            </div>
          </div>
        </div>
      )}
      <button
            className="btn-orbitar"
            onClick={handleClick}
            disabled={deshabilitado}
          >
            {textoBoton()}
          </button>
    </div>
  );
};

export default SuggestedPlanet;
