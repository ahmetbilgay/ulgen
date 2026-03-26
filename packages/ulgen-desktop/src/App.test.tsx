import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "@/components/ui/provider";
import { App } from "./App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/store/useConfigStore", () => ({
  useConfigStore: vi.fn(() => ({
    credentialSummary: { is_configured: false },
    hydrateCredentialSummary: vi.fn().mockResolvedValue(undefined),
    connectionStatus: null,
    activeRegion: "us-east-1",
  })),
}));

describe("App routes", () => {
  it.skip("shows onboarding when no credentials found", async () => {
    render(
      <Provider>
        <App />
      </Provider>,
    );

    // With the store mocked as initialized, this should render immediately
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
  });
});
