import "./SignalsPanel.css";

const ICONS = {
  destello: "✨",
  orbita: "🪐",
  eco: "📡",
  sistema: "🌌",
};

const SignalsPanel = ({ signals }) => {
  return (
    <div className="signals-panel">
      <div className="signals-header">
        <h3>Señales</h3>
      </div>
      <ul className="signals-list">
        {signals.length === 0 && (
          <li className="signals-empty">No hay señales nuevas</li>
        )}
        {signals.map((s) => (
          <li key={s.id} className={`signals-item ${s.read ? "" : "unread"}`}>
            <span className="signals-icon">{ICONS[s.type]}</span>
            <div className="signals-text">
              <p>{s.text}</p>
              <span className="signals-time">{s.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SignalsPanel;