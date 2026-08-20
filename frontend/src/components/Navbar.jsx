import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { useClickOutside } from "../hooks/useClickOutside";
import SignalsPanel from "./SignalsPanel";
import { escucharNotificaciones } from "../services/notificationService";
import { getProfileByIdCached } from "../services/userService";
import "./Navbar.css";

const items = [
  { label: "🌌 Cosmos", path: "/" },
  { label: "🔭 Explorar", path: "/explorar" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [showSignals, setShowSignals] = useState(false);
  const [signals, setSignals] = useState([]);
  const signalsRef = useRef(null);

  useClickOutside(signalsRef, () => setShowSignals(false));

  useEffect(() => {
    const usuarioId = auth.currentUser?.uid;
    if (!usuarioId) return;

    const unsubscribe = escucharNotificaciones(usuarioId, async (notificaciones) => {
      const textos = {
        destello: (nombre) => `${nombre} le dio destello a tu transmisión`,
        orbita: (nombre) => `${nombre} interactuó con tu órbita`,
        eco: (nombre) => `${nombre} dejó un eco en tu publicación`,
        sistema: () => `Notificación del sistema`,
      };

      const transformadas = await Promise.all(
        notificaciones.map(async (n) => {
          const perfilOrigen = n.origenId
            ? await getProfileByIdCached(n.origenId)
            : null;
          const nombre = perfilOrigen?.nombrePlaneta || "Alguien";

          return {
            id: n.id,
            type: n.tipo,
            text: (textos[n.tipo] || textos.sistema)(nombre),
            time: n.createdAt?.toDate?.().toLocaleString() || "",
            read: n.leida,
          };
        })
      );

      setSignals(transformadas);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = signals.filter((s) => !s.read).length;

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span>🪐</span>
          <h1>Nebula</h1>
        </div>

        <div className="navbar-right">
          <ul className="menu">
            {items.map((item) => (
              <li key={item.label} className="itemsMenu">
                <Link to={item.path} className="itemMenu">
                  {item.label}
                </Link>
              </li>
            ))}

            <li className="itemsMenu signals-wrapper" ref={signalsRef}>
              <button
                className="itemMenu"
                onClick={() => setShowSignals(!showSignals)}
              >
                📡 Señales
                {unreadCount > 0 && (
                  <span className="signals-badge">{unreadCount}</span>
                )}
              </button>
              {showSignals && <SignalsPanel signals={signals} />}
            </li>

            <li className="itemsMenu">
              <Link to="/perfil" className="itemMenu">
                🪐 Mi planeta
              </Link>
            </li>

            {(userProfile?.role ?? userProfile?.rol) === "admin" && (
              <li className="itemsMenu">
                <Link to="/admin" className="itemMenu">
                  🛡️ Panel Admin
                </Link>
              </li>
            )}
          </ul>

          <button className="btnSalir" onClick={handleLogout}>
            🚪 Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;