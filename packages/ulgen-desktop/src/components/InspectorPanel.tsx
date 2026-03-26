import type { DiscoveryResult } from "../hooks/useAws";

type InspectorPanelProps = {
  data: DiscoveryResult | null;
};

export function InspectorPanel({ data }: InspectorPanelProps) {
  return (
    <section className="panel inspector">
      <h2>Inspector</h2>
      <dl>
        <div>
          <dt>Provider</dt>
          <dd>{data?.provider ?? "aws"}</dd>
        </div>
        <div>
          <dt>Regions</dt>
          <dd>{data?.regions_scanned.length ?? 0}</dd>
        </div>
        <div>
          <dt>Instances</dt>
          <dd>{data?.instances.length ?? 0}</dd>
        </div>
      </dl>
    </section>
  );
}
