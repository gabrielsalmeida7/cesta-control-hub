import { useState } from "react";
import { Download, MoreVertical, Monitor, Share, Smartphone, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { usePwaInstall, type PwaInstallMode } from "@/hooks/usePwaInstall";

const publicRoutes = ["/login", "/reset-password", "/politica-privacidade", "/portal-titular"];

function getBannerDescription(installMode: PwaInstallMode, isSecureContext: boolean) {
  if (!isSecureContext) {
    return "Instalação disponível em HTTPS (produção) ou localhost. Use o guia para instalar manualmente.";
  }

  switch (installMode) {
    case "native-prompt":
      return "Instale o app para acesso rápido em campo, mesmo offline parcial.";
    case "ios-manual":
      return "Adicione à Tela de Início para usar como app em campo.";
    case "android-manual":
      return "Instale pelo menu do Chrome para acesso rápido em campo.";
    case "desktop-manual":
      return "Instale no computador para abrir em janela própria, como um app.";
    default: {
      const _exhaustive: never = installMode;
      return _exhaustive;
    }
  }
}

function getInstallButtonLabel(installMode: PwaInstallMode) {
  switch (installMode) {
    case "native-prompt":
      return "Instalar app";
    case "ios-manual":
    case "android-manual":
    case "desktop-manual":
      return "Como instalar";
    default: {
      const _exhaustive: never = installMode;
      return _exhaustive;
    }
  }
}

export function InstallPWA() {
  const { user } = useAuth();
  const location = useLocation();
  const {
    canInstall,
    installMode,
    isSecureContext,
    install,
    dismiss,
  } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  const isPublicRoute = publicRoutes.some((route) => location.pathname.startsWith(route));

  if (!user || isPublicRoute || !canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (installMode === "native-prompt") {
      await install();
      return;
    }

    setShowGuide(true);
  };

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-lg rounded-lg border border-[#004E64]/20 bg-white p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:left-auto">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#004E64] text-white">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Instale o CestaJusta</p>
            <p className="mt-1 text-sm text-gray-600">
              {getBannerDescription(installMode, isSecureContext)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="bg-[#004E64] hover:bg-[#003648]" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                {getInstallButtonLabel(installMode)}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Agora não
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 hover:text-gray-600"
            aria-label="Fechar aviso de instalação"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {installMode === "ios-manual" && "Instalar no iPhone"}
              {installMode === "android-manual" && "Instalar no Android"}
              {installMode === "desktop-manual" && "Instalar no computador"}
            </DialogTitle>
            <DialogDescription>
              {!isSecureContext
                ? "Em rede local (HTTP), a instalação automática não funciona. Use os passos abaixo ou acesse a versão publicada na Vercel (HTTPS)."
                : "Siga os passos abaixo para instalar o CestaJusta."}
            </DialogDescription>
          </DialogHeader>

          {installMode === "ios-manual" && (
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Toque em <strong>Compartilhar</strong> na barra inferior do Safari.</span>
              </li>
              <li className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Confirme tocando em <strong>Adicionar</strong>.</span>
              </li>
            </ol>
          )}

          {installMode === "android-manual" && (
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <MoreVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Toque no menu <strong>⋮</strong> do Chrome (canto superior direito).</span>
              </li>
              <li className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>
                  Selecione <strong>Instalar app</strong> ou <strong>Adicionar à Tela inicial</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Confirme a instalação. O ícone aparecerá na tela inicial.</span>
              </li>
            </ol>
          )}

          {installMode === "desktop-manual" && (
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>
                  No Chrome ou Edge, clique no ícone <strong>Instalar</strong> na barra de endereço
                  (ou menu ⋮ → <strong>Instalar CestaJusta…</strong>).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#004E64]" aria-hidden="true" />
                <span>Confirme para abrir o app em janela própria, com ícone na barra de tarefas.</span>
              </li>
            </ol>
          )}

          <DialogFooter>
            <Button onClick={() => setShowGuide(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
