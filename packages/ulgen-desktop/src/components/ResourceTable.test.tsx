import { render, screen } from "@testing-library/react";
import { Provider } from "@/components/ui/provider";
import { ResourceTable } from "./ResourceTable";

describe("ResourceTable", () => {
  it("renders discovered EC2 instances", () => {
    render(
      <Provider>
        <ResourceTable
          isLoading={false}
          error={null}
          bg="#111827"
          border="rgba(255,255,255,0.08)"
          muted="#94a3b8"
          data={{
            provider: "aws",
            generated_at: new Date().toISOString(),
            regions_scanned: ["eu-central-1"],
            instances: [
              {
                id: "i-123",
                name: "prod-web",
                region: "eu-central-1",
                state: "running",
                public_ip: "1.2.3.4",
                private_ip: "10.0.0.10",
                instance_type: "t3.micro",
                launched_at: null,
              },
            ],
          }}
        />
      </Provider>,
    );

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    expect(screen.getByText("eu-central-1")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});
