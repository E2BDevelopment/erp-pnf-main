export const ROLE_DEFAULT_COLORS = {
  director: "#64748B",
  residente: "#2563EB",
  auxiliar: "#7C3AED",
  administrativo: "#059669",
  supervisor: "#D97706",
} as const;

export function roleColor(role: string, customColor?: string | null) {
  if (customColor && /^#[\da-f]{6}$/i.test(customColor)) return customColor;
  return ROLE_DEFAULT_COLORS[role as keyof typeof ROLE_DEFAULT_COLORS] ?? "#64748B";
}

export function roleColorText(color: string) {
  const value = color.replace("#", "");
  const luminanceChannel = (start: number) => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    luminanceChannel(0) * 0.2126 + luminanceChannel(2) * 0.7152 + luminanceChannel(4) * 0.0722;
  return luminance > 0.179 ? "#20252b" : "#ffffff";
}
