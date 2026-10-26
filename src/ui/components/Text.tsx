import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type TypographyVariant } from '@/ui/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  muted?: boolean;
  color?: string;
}

export function Text({ variant = 'body', muted = false, color, style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier ?? 2}
      style={[
        typography[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        style,
      ]}
    />
  );
}
