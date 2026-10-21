import { METRIC_DEFINITIONS } from "@/lib/metrics";

export default function MetricDefinitions() {
  return (
    <details className="panel mt-8 overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-muted transition hover:text-fg">
        Metric definitions and limitations
        <span className="ml-2 text-[10px] font-normal">
          ({METRIC_DEFINITIONS.length} metrics)
        </span>
      </summary>
      <div className="grid gap-x-6 gap-y-4 border-t border-line p-4 md:grid-cols-2 xl:grid-cols-3">
        {METRIC_DEFINITIONS.map((metric) => (
          <div key={metric.key}>
            <p className="text-xs font-semibold">{metric.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {metric.definition}
            </p>
            {metric.caveat ? (
              <p className="mt-1 text-[10px] leading-relaxed text-warn">
                {metric.caveat}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  );
}
