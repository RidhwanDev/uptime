/**
 * Color palette designed to appeal to TikTok creators
 * Vibrant, modern, and engaging
 */

export const colors = {
  // Primary brand colors
  primary: '#FF0050', // TikTok-inspired pink/red
  primaryDark: '#CC003D',
  primaryLight: '#FF3366',
  
  // Accent colors
  accent: '#00F2EA', // Cyan accent
  accentDark: '#00C4B8',
  
  // Background colors
  background: '#000000',
  backgroundSecondary: '#161823',
  backgroundTertiary: '#1F1F1F',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceDark: '#2A2A2A',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textTertiary: '#717171',
  textDark: '#000000',
  
  // Status colors
  success: '#00D4AA',
  warning: '#FFB800',
  error: '#FF0050',
  info: '#00F2EA',
  
  // Border colors
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
} as const;

export type Color = typeof colors[keyof typeof colors];

