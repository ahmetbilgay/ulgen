import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "@/components/ui/provider";
import { App } from "./App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command: string) => {
    if (command === "load_aws_credentials") {
      return {
        is_configured: false,
        access_key_preview: null,
        default_region: "us-east-1",
      };
    }

    return null;
  }),
}));

describe("App routes", () => {
  it("moves from landing to dashboard", async () => {
    render(
      <Provider>
        <App />
      </Provider>,
    );

    expect(screen.getByText("ULGEN")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter workspace" }));

    expect((await screen.findAllByRole("heading", { name: "Add a provider" })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Add provider" }).length).toBeGreaterThan(0);
    expect(window.location.hash).toBe("#/app/home");
  });
});
