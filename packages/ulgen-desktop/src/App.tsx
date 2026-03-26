import { useEffect } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { InspectorPanel } from "./components/InspectorPanel";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { ResourceTable } from "./components/ResourceTable";
import { TerminalPanel } from "./components/TerminalPanel";
import { useAws } from "./hooks/useAws";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";

export function App() {
  const { data, isLoading, error, refresh } = useAws();
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const open = useCommandPaletteStore((state) => state.open);
  const close = useCommandPaletteStore((state) => state.close);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen, open]);

  return (
    <div className="shell">
      <NavigationSidebar onRefresh={refresh} />
      <main className="content">
        <section className="resource-pane">
          <header className="pane-header">
            <div>
              <p className="eyebrow">Sovereign Infrastructure Engine</p>
              <h1>Unified Resource List</h1>
            </div>
            <button className="primary-button" onClick={() => void refresh()}>
              Refresh Instances
            </button>
          </header>
          <ResourceTable data={data} isLoading={isLoading} error={error} />
        </section>
        <aside className="inspector-pane">
          <InspectorPanel data={data} />
          <TerminalPanel />
        </aside>
      </main>
      <CommandPalette />
    </div>
  );
}
