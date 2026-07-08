import { useCallback, useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "pwa-install-dismissed";

export type PwaInstallMode = "native-prompt" | "ios-manual" | "android-manual" | "desktop-manual";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIosDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return isIosDevice && isSafari;
}

function isAndroidDevice() {
  return /Android/i.test(window.navigator.userAgent);
}

function isDesktopChromium() {
  const userAgent = window.navigator.userAgent;
  return !isAndroidDevice() && !isIosSafari() && /Chrome|Edg|Chromium/i.test(userAgent);
}

function resolveInstallMode(
  deferredPrompt: BeforeInstallPromptEvent | null,
  isIos: boolean,
): PwaInstallMode {
  if (deferredPrompt) {
    return "native-prompt";
  }
  if (isIos) {
    return "ios-manual";
  }
  if (isAndroidDevice()) {
    return "android-manual";
  }
  return "desktop-manual";
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);
  const [isIos, setIsIos] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    setIsIos(isIosSafari());
    setIsStandalone(isStandaloneMode());
    setIsSecureContext(window.isSecureContext);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => setIsStandalone(isStandaloneMode());
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installMode = resolveInstallMode(deferredPrompt, isIos);

  const canInstall = !isStandalone && !isDismissed;

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setIsDismissed(true);
  }, []);

  return {
    canInstall,
    installMode,
    isIos,
    isStandalone,
    isSecureContext,
    isDesktopChromium: isDesktopChromium(),
    install,
    dismiss,
  };
}
