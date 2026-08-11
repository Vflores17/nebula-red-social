import { useState } from "react";
import "./SuggestedPlanet.css";

const SuggestedPlanet = ({
  nombre,
  handle,
  avatar,
  bio,
  satelites,
  orbitando,
}) => {
  const [following, setFollowing] = useState(false);

  return (
    <div className="card-planet">
      <div className="card-left">
      <div className="avatar" style={{ backgroundColor: avatar }}></div>
      <div className="info">
          <div className="nombre">{nombre}</div>
      
        <div className="handle">@{handle}</div>
        <div className="bio">{bio}</div>
        <div className="stats">
          <div className="satelites">{satelites} <span>Satélites</span> </div>
          <div className="orbitando">{orbitando} <span>orbitando</span></div>
        </div>
        
      </div>
      </div>
      <button
            className="btn-orbitar"
            onClick={() => setFollowing(!following)}
          >
            {following ? "Orbitando" : "Orbitar"}
          </button>
    </div>
  );
};

export default SuggestedPlanet;
