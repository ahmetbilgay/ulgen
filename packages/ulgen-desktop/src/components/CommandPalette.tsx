import { useCommandPaletteStore } from "../store/useCommandPaletteStore";

export function CommandPalette() {
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const close = useCommandPaletteStore((state) => state.close);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="command-palette-backdrop" onClick={close}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-input">Search resources or run actions like `ssh to prod`</div>
        <div className="command-results">
          <button className="command-result">Refresh EC2 inventory</button>
          <button className="command-result">Authorize current IP</button>
          <button className="command-result">SSH to production</button>
        </div>
      </div>
    </div>
  );
}
