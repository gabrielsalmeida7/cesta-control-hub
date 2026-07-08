import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });

  useEffect(() => {
    if (!needRefresh) {
      return;
    }

    toast("Nova versão disponível", {
      id: "pwa-update",
      description: "Atualize o app para usar a versão mais recente.",
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
      cancel: {
        label: "Depois",
        onClick: () => setNeedRefresh(false),
      },
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
