import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Provider } from "@/components/ui/provider";
// Custom styles are now managed via Chakra UI system.ts globalCss

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
