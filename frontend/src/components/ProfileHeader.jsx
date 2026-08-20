import { useState, useEffect, useRef } from "react";
import "./ProfileHeader.css";
import EditProfileModal from "./EditProfileModal";
import ReportModal from "./ReportModal";
import { auth } from "../config/firebase";
import {
  enviarSolicitud,
  obtenerEstado,
  aceptarSolicitud,
} from "../services/friendshipService";
import {
  obtenerRelacionBloqueo,
  bloquearUsuario,
  desbloquearUsuario,
} from "../services/blockService";

const ProfileHeader = ({ profile, isOwnProfile = true, onProfileUpdate }) => {
  const [editando, setEditando] = useState(false);
  const [relacion, setRelacion] = useState(null); // null | {estado, esSolicitante, id}
  const [cargandoRelacion, setCargandoRelacion] = useState(false);
  const [bloqueo, setBloqueo] = useState({ yoLoBloqueo: false, meBloqueo: false });
  const [cargandoBloqueo, setCargandoBloqueo] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [reportando, setReportando] = useState(false);
  const menuRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;

  // Solo nos interesa el estado de amistad y de bloqueo cuando vemos el perfil de OTRO usuario
  useEffect(() => {
    if (isOwnProfile || !profile.uid || !currentUserId) return;

    obtenerEstado(currentUserId, profile.uid).then(setRelacion).catch(console.error);
    obtenerRelacionBloqueo(currentUserId, profile.uid).then(setBloqueo).catch(console.error);
  }, [isOwnProfile, profile.uid, currentUserId]);

  // Cierra el menú de opciones (⋮) si se hace click afuera
  useEffect(() => {
    if (!menuAbierto) return;

    const handleClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [menuAbierto]);

  const handleClickRelacion = async () => {
    if (!profile.uid || !currentUserId || cargandoRelacion) return;
    setCargandoRelacion(true);
    try {
      if (!relacion) {
        await enviarSolicitud(currentUserId, profile.uid);
        setRelacion({ estado: "pendiente", esSolicitante: true });
      } else if (relacion.estado === "pendiente" && !relacion.esSolicitante) {
        await aceptarSolicitud(relacion);
        setRelacion({ ...relacion, estado: "aceptada" });
      }
    } catch (err) {
      alert(err.message || "No se pudo completar la acción");
    } finally {
      setCargandoRelacion(false);
    }
  };

  const textoBotonRelacion = () => {
    if (!relacion) return "Orbitar";
    if (relacion.estado === "aceptada") return "Orbitando";
    if (relacion.estado === "pendiente" && relacion.esSolicitante) return "Solicitud enviada";
    if (relacion.estado === "pendiente" && !relacion.esSolicitante) return "Aceptar solicitud";
    return "Orbitar";
  };

  const relacionDeshabilitada =
    cargandoRelacion ||
    (relacion?.estado === "pendiente" && relacion.esSolicitante) ||
    relacion?.estado === "aceptada";

  const handleToggleBloqueo = async () => {
    if (!profile.uid || !currentUserId || cargandoBloqueo) return;
    setCargandoBloqueo(true);
    setMenuAbierto(false);
    try {
      if (bloqueo.yoLoBloqueo) {
        await desbloquearUsuario(currentUserId, profile.uid);
        setBloqueo((prev) => ({ ...prev, yoLoBloqueo: false }));
      } else {
        const confirmar = window.confirm(
          `¿Bloquear a ${profile.displayName}? No podrán interactuar entre ustedes.`
        );
        if (!confirmar) return;
        await bloquearUsuario(currentUserId, profile.uid);
        setBloqueo((prev) => ({ ...prev, yoLoBloqueo: true }));
        // Si lo bloqueo, cualquier relación de amistad pendiente deja de tener sentido visualmente
        setRelacion(null);
      }
    } catch (err) {
      alert(err.message || "No se pudo completar la acción");
    } finally {
      setCargandoBloqueo(false);
    }
  };

  const puedenInteractuar = !bloqueo.yoLoBloqueo && !bloqueo.meBloqueo;

  return (
    <div className="profile-header">
      <div className="profile-cover" />

      <div className="profile-info">
        <div className="profile-top">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.displayName} />
            ) : (
              <div className="profile-avatar-placeholder" />
            )}
          </div>

          {isOwnProfile ? (
            <button className="btnEditar" onClick={() => setEditando(true)}>
              Editar Planeta
            </button>
          ) : (
            <div className="profile-actions" ref={menuRef}>
              {puedenInteractuar ? (
                <button
                  className="btnEditar"
                  onClick={handleClickRelacion}
                  disabled={relacionDeshabilitada}
                >
                  {textoBotonRelacion()}
                </button>
              ) : (
                <span className="bloqueo-aviso">
                  {bloqueo.yoLoBloqueo ? "Bloqueado por ti" : "Te ha bloqueado"}
                </span>
              )}

              <button
                type="button"
                className="btnMenu"
                onClick={() => setMenuAbierto((prev) => !prev)}
                aria-label="Más opciones"
              >
                ⋮
              </button>

              {menuAbierto && (
                <div className="profile-menu">
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={handleToggleBloqueo}
                    disabled={cargandoBloqueo}
                  >
                    {bloqueo.yoLoBloqueo ? "Desbloquear planeta" : "Bloquear planeta"}
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item profile-menu-item-danger"
                    onClick={() => {
                      setMenuAbierto(false);
                      setReportando(true);
                    }}
                  >
                    Reportar planeta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h2 className="profile-name">{profile.displayName}</h2>
        <p className="profile-username">@{profile.username}</p>
        <p className="profile-bio">{profile.bio}</p>

        <div className="profile-meta">
          <span>📍 {profile.location}</span>
          <span>📅 Se unió en {profile.joinedAt}</span>
        </div>

        <div className="profile-stats">
          <span>
            <strong>{profile.satellites}</strong> Satélites
          </span>
          <span>
            <strong>{profile.orbiting}</strong> Orbitando
          </span>
        </div>

      </div>

      {editando && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditando(false)}
          onSaved={(datosActualizados) => {
            onProfileUpdate?.(datosActualizados);
            setEditando(false);
          }}
        />
      )}

      {reportando && (
        <ReportModal
          targetType="user"
          targetId={profile.uid}
          onClose={() => setReportando(false)}
        />
      )}
    </div>
  );
};

export default ProfileHeader;
