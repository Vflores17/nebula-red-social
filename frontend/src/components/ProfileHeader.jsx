import "./ProfileHeader.css";

const ProfileHeader = ({ profile }) => {
  return (
    <div className="profile-header">
      <div className="profile-cover" />

      <div className="profile-info">
        <div className="profile-top">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.displayName} />
            ) : (
              <div className="profile-avatar-placeholder" />
            )}
          </div>
          <button className="btnEditar">Editar Planeta</button>
        </div>

        <h2 className="profile-name">{profile.displayName}</h2>
        <p className="profile-username">@{profile.username}</p>
        <p className="profile-bio">{profile.bio}</p>

        <div className="profile-meta">
          <span>📍 {profile.location}</span>
          <span>📅 Se unió en {profile.joinedAt}</span>
        </div>

        <div className="profile-stats">
          <span>
            <strong>{profile.satellites}</strong> Satélites
          </span>
          <span>
            <strong>{profile.orbiting}</strong> Orbitando
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;