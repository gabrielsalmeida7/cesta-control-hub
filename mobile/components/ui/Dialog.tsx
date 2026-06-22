import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/constants/layout';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <Pressable
        style={styles.overlay}
        className="items-center justify-center p-4"
        onPress={() => onOpenChange(false)}
      >
        <Pressable style={styles.contentWrap} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View style={styles.dialogContent} className={cn('rounded-lg p-6 shadow-xl', className)}>
      {children}
    </View>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <View className="mb-4">{children}</View>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <Text className="text-lg font-semibold text-foreground">{children}</Text>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <Text className="mt-1 text-sm text-muted-foreground">{children}</Text>;
}

export function DialogClose({ onPress }: { onPress: () => void }) {
  return (
    <Pressable className="absolute right-4 top-4" onPress={onPress}>
      <X size={20} color="#6B7280" />
    </Pressable>
  );
}

export function DialogScrollBody({ children }: { children: React.ReactNode }) {
  return <ScrollView style={styles.dialogScroll}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentWrap: {
    width: '100%',
    maxWidth: 448,
  },
  dialogContent: {
    backgroundColor: colors.background,
  },
  dialogScroll: {
    maxHeight: 320,
  },
});
