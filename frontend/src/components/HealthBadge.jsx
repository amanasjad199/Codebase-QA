import { useQuery } from "@tanstack/react-query";
import { getHealth, qk } from "../api/client.js";

export function HealthBadge() {
  const { data, isError } = useQuery({
    queryKey: qk.health,
    queryFn: getHealth,
    refetchInterval: 30000,
    retry: false,
  });

  let state = "down";
  let text = "offline";
  if (data) {
    state = data.status === "ok" ? "ok" : "degraded";
    text = data.status === "ok" ? "online" : "degraded";
  } else if (!isError) {
    state = "down";
    text = "connecting";
  }

  return (
    <div className="health" title={data ? `vector_db: ${data.vector_db} · llm: ${data.llm} · embedding: ${data.embedding}` : "backend unreachable"}>
      <span className={`health-dot ${state}`} />
      <span>API {text}</span>
    </div>
  );
}
