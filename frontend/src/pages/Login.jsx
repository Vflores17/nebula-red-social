import { useState } from "react";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="login-page">
      <div className="login-header">
        <div className="logo-circle">🪐</div>
        <h1>Nebula</h1>
        <p>Tu red social en el cosmos</p>
      </div>

      <div className="login-card">
        <h2>Accede al cosmos</h2>

        <form >
          <label>Correo estelar</label>
          <input type="email" placeholder="explorador@nebula.cosmos" value={correo} onChange={(e) => setCorreo(e.target.value)} />

          <label>Código de acceso</label>
          <input type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)}/>

          <button type="submit">Ingresar al universo ✨</button>
        </form>

        <p className="register-link">¿Eres nuevo en el cosmos? Registrate</p>
      </div>
    </div>
  );
}

export default Login;
