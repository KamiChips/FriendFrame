import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";

import { Toast, type ToastProps } from "@/components/ui/Toast";

export type ToastMessage = Omit<ToastProps, "onDismiss">;

// tiempo que el aviso queda en pantalla si nadie lo cierra
const TOAST_DURATION_MS = 6000;

const ToastContext = createContext<(toast: ToastMessage) => void>(() => {});

// muestra un aviso a la vez en la esquina inferior derecha; sobrevive a la navegacion
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  const showToast = useCallback((message: ToastMessage) => {
    setToast({ ...message, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      <View className="flex-1">
        {children}
        {toast && (
          <View className="absolute bottom-7 right-8 w-[496px] max-w-full">
            <Toast key={toast.id} {...toast} onDismiss={() => setToast(null)} />
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
