/* imports*/
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import "./Login.css";

/* definicion del componente*/
function Login() {
  /* *************  estados del componente   **************/
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const navigate = useNavigate();
  /* *******    funciones del componente    *************/

  /* Funcion para validar datos del formulario */
  const handleLogin = async (e) => {
  e.preventDefault();

  if (correo.trim() === "" || password.trim() === "") {
    setError("Completa tu correo estelar y clave de acceso.");
    return;
  }
  if (!regexCorreo.test(correo.trim())) {
    setError("Ingresa un correo estelar válido.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, correo.trim(), password);
    setError("");
    navigate("/");
  } catch (err) {
    setError("Correo o clave incorrectos.");
  }
};

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="logo-circle">🪐</div>
        <h1>Nebula</h1>
        <p>Tu red social en el cosmos</p>
      </div>

      <div className="login-card">
        <h2>Accede al cosmos</h2>
        <form onSubmit={handleLogin} noValidate>
          <div className="input-mail">
            <label>Correo estelar </label>
            <input
              type="email"
              placeholder="explorador@nebula.cosmos"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="input-pwd">
            <label>Clave estelar </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="btn-submit">
            <button id="btn_ingresar" type="submit">
              Ingresar al universo ✨
            </button>
          </div>
        </form>{" "}
        {error && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>⚠️ Acceso denegado</h3>
              <p>{error}</p>

              <button
                type="button"
                className="modal-button"
                onClick={() => setError("")}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
        <br />
        <p className="register-link">
          ¿Olvidaste tu clave estelar? <Link to="/recuperar">Recupérala</Link>
        </p>
        <p className="register-link">
          ¿Eres nuevo en el cosmos? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
