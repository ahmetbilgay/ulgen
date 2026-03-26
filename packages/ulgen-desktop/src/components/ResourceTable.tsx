import type { DiscoveryResult } from "../hooks/useAws";

type ResourceTableProps = {
  data: DiscoveryResult | null;
  isLoading: boolean;
  error: string | null;
};

export function ResourceTable({ data, isLoading, error }: ResourceTableProps) {
  if (isLoading) {
    return <div className="panel">Scanning active AWS regions...</div>;
  }

  if (error) {
    return <div className="panel error-state">{error}</div>;
  }

  return (
    <div className="panel">
      <table className="resource-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Region</th>
            <th>State</th>
            <th>Public IP</th>
            <th>Private IP</th>
          </tr>
        </thead>
        <tbody>
          {data?.instances.length ? (
            data.instances.map((instance) => (
              <tr key={`${instance.region}:${instance.id}`}>
                <td>{instance.name}</td>
                <td>{instance.region}</td>
                <td>{instance.state}</td>
                <td>{instance.public_ip ?? "n/a"}</td>
                <td>{instance.private_ip ?? "n/a"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="empty-state">
                No EC2 instances discovered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
