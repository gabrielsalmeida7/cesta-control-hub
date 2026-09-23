import { usePublicImpactStats } from "@/hooks/usePublicImpactStats";

interface PublicImpactStatsProps {
  variant: "onDark" | "onLight";
}

const BANK_NAME = "Banco de Alimentos de Araguari";
const BANK_PATRON = "Rivalino de Sousa Pereira";
const INAUGURATION = "Inaugurado em 27 de agosto de 2021";
const FOOD_AMOUNT = "74 mil kg";
const FOOD_PERIOD = "distribuídos de janeiro a agosto de 2026";
const STATS_PERIOD = "desde janeiro de 2026";

const PublicImpactStats = ({ variant }: PublicImpactStatsProps) => {
  const { data } = usePublicImpactStats();

  const familiesLabel = "Famílias cadastradas";
  const deliveriesLabel = "Cestas entregues";

  switch (variant) {
    case "onDark":
      return (
        <div className="mt-8 max-w-md">
          <p className="text-2xl font-bold tabular-nums">{FOOD_AMOUNT}</p>
          <p className="text-sm text-white/80">{FOOD_PERIOD}</p>
          {data ? (
            <div className="mt-6" aria-label="Números públicos do programa">
              <p className="mb-2 text-sm text-white/80">desde Janeiro de 2026 foram:</p>
              <div className="flex gap-8">
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
            </div>
          ) : null}
        </div>
      );
    case "onLight":
      return (
        <div className="mb-4 rounded-md border bg-muted/40 px-3 py-3">
          <p className="text-center text-xs font-semibold leading-snug text-foreground">
            {BANK_NAME}
          </p>
          <p className="text-center text-[11px] text-muted-foreground">{BANK_PATRON}</p>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">{INAUGURATION}</p>
          <p className="mt-2 text-center text-sm font-semibold tabular-nums text-foreground">
            {FOOD_AMOUNT}
          </p>
          <p className="text-center text-[11px] text-muted-foreground">{FOOD_PERIOD}</p>
          {data ? (
            <div className="mt-3" aria-label="Números públicos do programa">
              <div className="grid grid-cols-2 gap-3">
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
              <p className="mt-2 text-center text-[11px] text-muted-foreground">{STATS_PERIOD}</p>
            </div>
          ) : null}
        </div>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
};

export default PublicImpactStats;
