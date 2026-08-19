import { useState, useRef } from "react";
import { useClickOutside } from "../hooks/useClickOutside";
import SignalsPanel from "./SignalsPanel";
import { signals } from "../mocks/signals";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

const items = [
  { label: "🌌 Cosmos", path: "/" },
  { label: "🔭 Explorar", path: "/explorar" },
  { label: "⚙️ Cuenta", path: "/configuracion" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [showSignals, setShowSignals] = useState(false);
  const signalsRef = useRef(null);

  useClickOutside(signalsRef, () => setShowSignals(false));

  const unreadCount = signals.filter((s) => !s.read).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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
              </Link>  </li>
</ul>
<button className="btnSalir" onClick={handleLogout}>
        🚪Salir
      </button>        </div>
      </div>
    </nav>
  );
};

export default Navbar;