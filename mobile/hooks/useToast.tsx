import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { cn } from '@/lib/cn';

type ToastVariant = 'default' | 'destructive';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const isDestructive = item.variant === 'destructive';

  return (
    <Pressable
      onPress={onDismiss}
      className={cn(
        'mx-4 mb-2 rounded-lg border p-4 shadow-lg',
        isDestructive ? 'border-danger bg-danger' : 'border-border bg-white'
      )}
    >
      <Text className={cn('font-semibold', isDestructive ? 'text-white' : 'text-foreground')}>
        {item.title}
      </Text>
      {item.description ? (
        <Text className={cn('mt-1 text-sm', isDestructive ? 'text-white/90' : 'text-muted-foreground')}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...options, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View className="absolute bottom-12 left-0 right-0 z-50">
        {toasts.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
