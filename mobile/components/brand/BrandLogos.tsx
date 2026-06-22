import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CESTA_JUSTA_LOGO_XML, CESTA_LOGIN_XML } from '@/components/brand/brandXml';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CestaLoginMark({ width = 48, height, className }: LogoProps) {
  const computedHeight = height ?? (width * 356) / 391;

  return (
    <View className={className}>
      <SvgXml xml={CESTA_LOGIN_XML} width={width} height={computedHeight} />
    </View>
  );
}

export function CestaJustaLogo({ width = 240, height, className }: LogoProps) {
  const computedHeight = height ?? (width * 410) / 1054;

  return (
    <View className={className}>
      <SvgXml xml={CESTA_JUSTA_LOGO_XML} width={width} height={computedHeight} />
    </View>
  );
}
