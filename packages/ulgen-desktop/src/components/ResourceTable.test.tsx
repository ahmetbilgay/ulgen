import { render, screen } from "@testing-library/react";
import { ResourceTable } from "./ResourceTable";

describe("ResourceTable", () => {
  it("renders discovered EC2 instances", () => {
    render(
      <ResourceTable
        isLoading={false}
        error={null}
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
      />,
    );

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    expect(screen.getByText("eu-central-1")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});
