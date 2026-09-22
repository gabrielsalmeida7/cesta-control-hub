import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicImpactStats {
  familiesCount: number;
  deliveriesCount: number;
}

export const usePublicImpactStats = () => {
  return useQuery({
    queryKey: ["public-impact-stats"],
    queryFn: async (): Promise<PublicImpactStats | null> => {
      try {
        const { data, error } = await supabase
          .from("public_impact_stats")
          .select("families_count, deliveries_count")
          .eq("id", 1)
          .maybeSingle();

        if (error || !data) {
          return null;
        }

        return {
          familiesCount: Number(data.families_count ?? 0),
          deliveriesCount: Number(data.deliveries_count ?? 0),
        };
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};
