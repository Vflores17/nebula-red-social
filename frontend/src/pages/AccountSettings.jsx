import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./Login.css";

function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");

  const [passwordEliminar, setPasswordEliminar] = useState("");
  const [confirmacionTexto, setConfirmacionTexto] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);

  /* ---------- CAMBIAR CLAVE ---------- */
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setError("Completa los tres campos.");
      return;
    }
    if (passwordNueva.length < 6) {
      setError("La clave nueva debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      setError("La clave nueva y su confirmación no coinciden.");
      return;
    }
    if (passwordNueva === passwordActual) {
      setError("La clave nueva debe ser distinta de la actual.");
      return;
    }

    try {
      setLoading(true);
      const credencial = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(auth.currentUser, credencial);
      await updatePassword(auth.currentUser, passwordNueva);

      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setMensaje("Tu clave estelar fue actualizada con éxito.");
    } catch (err) {
      console.error("Error al cambiar la clave:", err.code);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("La clave actual no es correcta.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
      } else {
        setError("No pudimos actualizar tu clave. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- DESACTIVAR CUENTA ---------- */
  const handleDesactivar = async () => {
    setMensaje("");
    setError("");

    try {
      setLoading(true);
      await updateDoc(doc(db, "users", user.uid), {
        activo: false,
        desactivadoEn: serverTimestamp(),
      });
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error al desactivar:", err.code);
      setError("No pudimos desactivar tu planeta. Intenta de nuevo.");
      setLoading(false);
    }
  };

  /* ---------- ELIMINAR CUENTA ---------- */
  const handleEliminar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (confirmacionTexto.trim().toUpperCase() !== "ELIMINAR") {
      setError("Escribe la palabra ELIMINAR para confirmar.");
      return;
    }
    if (!passwordEliminar) {
      setError("Ingresa tu clave actual para confirmar.");
      return;
    }

    try {
      setLoading(true);
      const credencial = EmailAuthProvider.credential(user.email, passwordEliminar);
      await reauthenticateWithCredential(auth.currentUser, credencial);

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);

      navigate("/register", { replace: true });
    } catch (err) {
      console.error("Error al eliminar la cuenta:", err.code);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("La clave no es correcta.");
      } else {
        setError("No pudimos eliminar tu planeta. Intenta de nuevo.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-page">
        <div className="login-card">
          <h2>Configuración de cuenta</h2>
          <p className="register-link">
            Correo estelar: <strong>{user?.email}</strong>
          </p>

          <br />
          <h3>Cambiar clave estelar</h3>
          <form onSubmit={handleCambiarPassword} noValidate>
            <div className="input-pwd">
              <label>Clave actual </label>
              <input type="password" placeholder="••••••••" value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)} />
            </div>
            <div className="input-pwd">
              <label>Clave nueva </label>
              <input type="password" placeholder="••••••••" value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)} />
            </div>
            <div className="input-pwd">
              <label>Confirmar clave nueva </label>
              <input type="password" placeholder="••••••••" value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)} />
            </div>
            <div className="btn-submit">
              <button id="btn_ingresar" type="submit" disabled={loading}>
                {loading ? "Procesando..." : "Actualizar clave 🔐"}
              </button>
            </div>
          </form>

          <br />
          <hr />
          <h3>Desactivar planeta</h3>
          <p className="register-link">
            Tu planeta deja de estar visible, pero no se borra nada. Vuelve a
            iniciar sesión cuando quieras y se reactiva solo.
          </p>
          <div className="btn-submit">
            <button type="button" className="modal-button" disabled={loading}
              onClick={() => setConfirmarDesactivar(true)}>
              Desactivar mi planeta 🌑
            </button>
          </div>

          <br />
          <hr />
          <h3>Eliminar planeta</h3>
          <p className="register-link">
            Esto borra tu cuenta y tu perfil para siempre. No se puede deshacer.
          </p>
          <form onSubmit={handleEliminar} noValidate>
            <div className="input-pwd">
              <label>Escribe ELIMINAR para confirmar </label>
              <input type="text" placeholder="ELIMINAR" value={confirmacionTexto}
                onChange={(e) => setConfirmacionTexto(e.target.value)} />
            </div>
            <div className="input-pwd">
              <label>Tu clave actual </label>
              <input type="password" placeholder="••••••••" value={passwordEliminar}
                onChange={(e) => setPasswordEliminar(e.target.value)} />
            </div>
            <div className="btn-submit">
              <button id="btn_ingresar" type="submit" disabled={loading}>
                {loading ? "Procesando..." : "Eliminar definitivamente 💥"}
              </button>
            </div>
          </form>

          <br />
          <p className="register-link">
            <button type="button" className="modal-button" onClick={() => navigate("/perfil")}>
              Volver a mi planeta
            </button>
          </p>

          {confirmarDesactivar && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h3>🌑 ¿Desactivar tu planeta?</h3>
                <p>Se cerrará tu sesión. Podrás reactivarlo iniciando sesión de nuevo.</p>
                <button type="button" className="modal-button" onClick={handleDesactivar}>
                  Sí, desactivar
                </button>
                <button type="button" className="modal-button"
                  onClick={() => setConfirmarDesactivar(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {mensaje && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h3>✅ Listo</h3>
                <p>{mensaje}</p>
                <button type="button" className="modal-button" onClick={() => setMensaje("")}>
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
                <button type="button" className="modal-button" onClick={() => setError("")}>
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AccountSettings;