import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import "./Login.css";

function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleReset = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (correo.trim() === "") {
      setError("Ingresa tu correo estelar.");
      return;
    }
    if (!regexCorreo.test(correo.trim())) {
      setError("Ingresa un correo estelar válido.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, correo.trim());
      setMensaje(
        "Si ese correo está registrado, enviamos un enlace para restablecer tu clave estelar. Revisa tu bandeja y la carpeta de spam."
      );
    } catch (err) {
      console.error("Error al enviar el correo:", err.code);
      if (err.code === "auth/user-not-found") {
        setMensaje(
          "Si ese correo está registrado, enviamos un enlace para restablecer tu clave estelar. Revisa tu bandeja y la carpeta de spam."
        );
      } else {
        setError("No pudimos enviar el correo. Intenta de nuevo en un momento.");
      }
    } finally {
      setLoading(false);
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
        <h2>Recupera tu acceso</h2>
        <p className="register-link">
          Ingresa tu correo estelar y te enviaremos un enlace para crear una
          clave nueva.
        </p>
        <form onSubmit={handleReset} noValidate>
          <div className="input-mail">
            <label>Correo estelar </label>
            <input
              type="email"
              placeholder="explorador@nebula.cosmos"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="btn-submit">
            <button id="btn_ingresar" type="submit" disabled={loading}>
              {loading ? "Enviando señal..." : "Enviar enlace 📡"}
            </button>
          </div>
        </form>

        {mensaje && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>📡 Señal enviada</h3>
              <p>{mensaje}</p>
              <button
                type="button"
                className="modal-button"
                onClick={() => setMensaje("")}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>⚠️ Algo falló</h3>
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
          ¿Ya la recordaste? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;