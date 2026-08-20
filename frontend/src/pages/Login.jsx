/* imports*/
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { loginWithGoogle } from "../services/authService";
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

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      setError("");
      navigate("/");
    } catch (err) {
      console.error("Error con Google:", err.code);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Cerraste la ventana de Google antes de terminar.");
      } else {
        setError("No pudimos conectarte con Google. Intenta de nuevo.");
      }
    }
  };

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
    const credenciales = await signInWithEmailAndPassword(auth, correo.trim(), password);
    const perfilRef = doc(db, "users", credenciales.user.uid);
    const perfil = await getDoc(perfilRef);

    if (perfil.exists() && perfil.data().activo === false) {
      await updateDoc(perfilRef, { activo: true, desactivadoEn: null });
    }
    setError("");
    navigate("/");
  } catch {
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
        <div className="btn-submit">
          <button type="button" id="btn_ingresar" onClick={handleGoogle}>
            Continuar con Google 🌐
          </button>
        </div>
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
