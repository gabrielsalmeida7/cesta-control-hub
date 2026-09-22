import { usePublicImpactStats } from "@/hooks/usePublicImpactStats";

interface PublicImpactStatsProps {
  variant: "onDark" | "onLight";
}

const PublicImpactStats = ({ variant }: PublicImpactStatsProps) => {
  const { data } = usePublicImpactStats();

  if (!data) {
    return null;
  }

  const familiesLabel = "Famílias cadastradas";
  const deliveriesLabel = "Cestas entregues";

  switch (variant) {
    case "onDark":
      return (
        <div className="mt-8 flex max-w-md gap-8" aria-label="Números públicos do programa">
          <div>
            <p className="text-3xl font-bold tabular-nums md:text-4xl">
              {data.familiesCount.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-sm text-white/80">{familiesLabel}</p>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums md:text-4xl">
              {data.deliveriesCount.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-sm text-white/80">{deliveriesLabel}</p>
          </div>
        </div>
      );
    case "onLight":
      return (
        <div
          className="mb-4 grid grid-cols-2 gap-3 rounded-md border bg-muted/40 px-3 py-3"
          aria-label="Números públicos do programa"
        >
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {data.familiesCount.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">{familiesLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {data.deliveriesCount.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">{deliveriesLabel}</p>
          </div>
        </div>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
};

export default PublicImpactStats;
