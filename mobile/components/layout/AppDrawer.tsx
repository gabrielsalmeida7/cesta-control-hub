import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

export interface DrawerItem {
  label: string;
  href: Href;
  icon: LucideIcon;
}

interface AppDrawerProps {
  visible: boolean;
  title: string;
  items: DrawerItem[];
  onClose: () => void;
}

export function AppDrawer({ visible, title, items, onClose }: AppDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="mt-16 w-72 flex-1 bg-white p-4" onPress={(event) => event.stopPropagation()}>
          <Text className="mb-4 text-lg font-semibold text-foreground">{title}</Text>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                className="mb-1 flex-row items-center gap-3 rounded-lg p-3 active:bg-muted"
                onPress={() => {
                  onClose();
                  router.push(item.href);
                }}
              >
                <Icon size={20} color="#004E64" />
                <Text className="text-base text-foreground">{item.label}</Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
