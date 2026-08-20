import './ProfileTabs.css';
const TABS = [
  { key: "transmisiones", label: "✨ Transmisiones" },
  { key: "satelites", label: "🪐 Satélites" },
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
