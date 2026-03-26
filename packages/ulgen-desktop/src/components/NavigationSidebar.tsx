type NavigationSidebarProps = {
  onRefresh: () => Promise<void>;
};

export function NavigationSidebar({ onRefresh }: NavigationSidebarProps) {
  return (
    <nav className="sidebar">
      <div>
        <p className="brand-mark">ULGEN</p>
        <h2>Sovereign Ops</h2>
      </div>
      <div className="sidebar-section">
        <button className="nav-button">Resources</button>
        <button className="nav-button">Activity</button>
        <button className="nav-button">Teams</button>
      </div>
      <div className="sidebar-section">
        <button className="secondary-button" onClick={() => void onRefresh()}>
          Rescan AWS
        </button>
      </div>
    </nav>
  );
}
