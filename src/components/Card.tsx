import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  const cardStyle = [styles.card, styles[`card_${variant}`], style];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surfaceDark,
  },
  card_default: {
    backgroundColor: colors.surfaceDark,
  },
  card_elevated: {
    backgroundColor: colors.surfaceDark,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  card_outlined: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

