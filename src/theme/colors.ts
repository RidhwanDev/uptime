/**
 * Color palette designed to appeal to TikTok creators
 * Deep indigo theme - vibrant, modern, and premium
 */

export const colors = {
  // Primary brand colors
  primary: '#FF0050', // TikTok-inspired pink/red
  primaryDark: '#CC003D',
  primaryLight: '#FF3366',
  
  // Accent colors
  accent: '#00F2EA', // Cyan accent
  accentDark: '#00C4B8',
  
  // Background colors - Deep Indigo theme
  background: '#0B0A14', // Rich purple-black
  backgroundSecondary: '#151320', // Elevated surfaces
  backgroundTertiary: '#1E1B2E', // Tertiary elements
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceDark: '#252236', // Dark cards with purple tint
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B8B5C8', // Slightly purple-tinted gray
  textTertiary: '#6B6880',
  textDark: '#000000',
  
  // Status colors
  success: '#00D4AA',
  warning: '#FFB800',
  error: '#FF0050',
  info: '#00F2EA',
  
  // Border colors - with subtle purple undertone
  border: '#2D2A3D',
  borderLight: '#3D3A4D',
  
  // Overlay
  overlay: 'rgba(11, 10, 20, 0.85)',
  overlayLight: 'rgba(11, 10, 20, 0.5)',
} as const;

export type Color = typeof colors[keyof typeof colors];

