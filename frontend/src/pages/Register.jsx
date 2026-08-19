import { useState } from "react";
import { registerUser } from "../services/authService";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [nombrePlaneta, setNombrePlaneta] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [nombreDisponible, setNombreDisponible] = useState(false);
  const [correoValido, setCorreoValido] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!nombrePlaneta.trim() || !correo.trim() || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const user = await registerUser(
  nombrePlaneta,
  correo,
  password
);
      console.log("Usuario registrado:", user.uid);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error de Firebase:", error.code);
      setError("No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-header">
        <div className="logo-circle">🪐</div>
        <h1>Nebula</h1>
        <p>Tu red social en el cosmos</p>
      </div>

      <div className="register-card">
        <h2>Crea tu planeta</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-planeta">
            <label>Nombre del planeta </label>
            <input
              type="text"
              placeholder="Ej: Tierra, Kepler-22b..."
              value={nombrePlaneta}
              onChange={(e) => setNombrePlaneta(e.target.value)}
            />
          </div>
          <div className="input-correo">
            <label>Correo estelar</label>
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
          {error && <p className="register-error">{error}</p>}
          <div className="btn-submit">
            <button id="btn_lanzar" type="submit" disabled={loading}>
              {loading ? "Preparando lanzamiento..." : "Lanzar al cosmos 🚀"}
            </button>{" "}
          </div>
        </form>
        <br />
        <p className="register-link">
          ¿Ya tienes un planeta? <Link to="/login">Inicia sesión</Link>
        </p>{" "}
      </div>
    </div>
  );
}

export default Register;
