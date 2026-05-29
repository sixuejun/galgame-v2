import { animalIslandTheme } from './animalIsland';
import { hedieTheme } from './hedie';
import { liquidGlassTheme } from './liquidGlass';
import { newspaperTheme } from './newspaper';
import type { ComponentKey, ComponentSkin, ThemeDefinition } from './types';

export type { ComponentKey, ComponentSkin, ThemeDefinition };

const themeRegistry: Map<string, ThemeDefinition> = new Map([
  [newspaperTheme.id, newspaperTheme],
  [hedieTheme.id, hedieTheme],
  [animalIslandTheme.id, animalIslandTheme],
  [liquidGlassTheme.id, liquidGlassTheme],
]);

export function getTheme(id: string): ThemeDefinition {
  return themeRegistry.get(id) ?? newspaperTheme;
}

export function getThemeList(): ThemeDefinition[] {
  return Array.from(themeRegistry.values());
}

export function getComponentSkin(themeId: string, componentKey: ComponentKey): ComponentSkin | undefined {
  const theme = getTheme(themeId);
  if (!theme.usesImageShell) return undefined;
  return theme.components[componentKey];
}
