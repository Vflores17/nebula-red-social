import './ProfileTabs.css';
const TABS = [
  { key: "transmisiones", label: "✨ Transmisiones" },
  { key: "retransmisiones", label: "🔁 Retransmisiones" }, // ← nueva
  { key: "planetas", label: "🪐 Planetas" },
  { key: "orbitando", label: "🔄 Orbitando" },
];

const ProfileTabs = ({ activeTab, onChange }) => {
  return (
    <div className="profile-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`profile-tab ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;