import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function useOfflineAction() {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  const guardOnline = useCallback(
    (actionLabel: string) => {
      if (isOnline) {
        return true;
      }

      toast({
        title: "Sem conexão com a internet",
        description: `${actionLabel} exige conexão ativa. Verifique sua rede e tente novamente.`,
        variant: "destructive",
      });
      return false;
    },
    [isOnline, toast],
  );

  return { isOnline, guardOnline };
}
