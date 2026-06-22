import React from 'react';
import { ScrollView } from 'react-native';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';
import { screenStyle } from '@/constants/layout';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={screenStyle} contentContainerClassName="p-4 pb-8">
      <PrivacyPolicyContent />
    </ScrollView>
  );
}
