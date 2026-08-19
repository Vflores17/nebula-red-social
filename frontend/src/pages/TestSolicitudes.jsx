import { useState } from "react";
import { auth } from "../config/firebase";
import {
  enviarSolicitud,
  obtenerEstado,
  obtenerSolicitudesPendientes,
  aceptarSolicitud,
  rechazarSolicitud,
  obtenerAmigos,
} from "../services/friendshipService";

// Página de prueba temporal — NO la dejes en el proyecto final.
// Sirve para probar friendshipService directamente sin depender
// de que Explorer.jsx ya tenga usuarios reales conectados.
const TestSolicitudes = () => {
  const [otroUid, setOtroUid] = useState("");
  const [resultado, setResultado] = useState("");

  const yo = auth.currentUser?.uid;

  const mostrar = (data) => setResultado(JSON.stringify(data, null, 2));

  const probarEnviar = async () => {
    try {
      await enviarSolicitud(yo, otroUid);
      setResultado("✅ Solicitud enviada");
    } catch (err) {
      setResultado("❌ " + err.message);
    }
  };

  const probarEstado = async () => {
    const data = await obtenerEstado(yo, otroUid);
    mostrar(data);
  };

  const probarPendientes = async () => {
    const data = await obtenerSolicitudesPendientes(yo);
    mostrar(data);
  };

  const probarAceptar = async () => {
    const pendientes = await obtenerSolicitudesPendientes(yo);
    const solicitud = pendientes.find((s) => s.solicitanteId === otroUid);
    if (!solicitud) return setResultado("❌ No hay solicitud pendiente de ese uid");
    await aceptarSolicitud(solicitud);
    setResultado("✅ Solicitud aceptada");
  };

  const probarAmigos = async () => {
    const data = await obtenerAmigos(yo);
    mostrar(data);
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "#fff" }}>
      <h2>🧪 Test de solicitudes de amistad</h2>
      <p>Mi uid (usuario logueado): <b>{yo || "no hay sesión activa"}</b></p>

      <input
        placeholder="uid del otro usuario"
        value={otroUid}
        onChange={(e) => setOtroUid(e.target.value)}
        style={{ width: 350, padding: 8, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={probarEnviar}>Enviar solicitud</button>
        <button onClick={probarEstado}>Ver estado</button>
        <button onClick={probarPendientes}>Ver mis pendientes</button>
        <button onClick={probarAceptar}>Aceptar (de ese uid)</button>
        <button onClick={probarAmigos}>Ver mis amigos</button>
      </div>

      <pre style={{ background: "#111", padding: 16, borderRadius: 8 }}>
        {resultado}
      </pre>
    </div>
  );
};

export default TestSolicitudes;
