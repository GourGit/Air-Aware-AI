import type { AQICategory, AQIBreakpoint } from '@/types/air-quality';

/**
 * CPCB (Central Pollution Control Board) AQI breakpoints for India.
 */
export const AQI_BREAKPOINTS: AQIBreakpoint[] = [
  {
    category: 'good',
    min: 0,
    max: 50,
    label: 'Good',
    color: '#009966',
    description: 'Air quality is satisfactory and poses little or no risk.',
  },
  {
    category: 'satisfactory',
    min: 51,
    max: 100,
    label: 'Satisfactory',
    color: '#FFDE33',
    description: 'Air quality is acceptable. Minor concern for sensitive people.',
  },
  {
    category: 'moderate',
    min: 101,
    max: 200,
    label: 'Moderate',
    color: '#FF9933',
    description: 'May cause breathing discomfort to people with lung/heart disease.',
  },
  {
    category: 'poor',
    min: 201,
    max: 300,
    label: 'Poor',
    color: '#CC0033',
    description: 'May cause breathing discomfort on prolonged exposure.',
  },
  {
    category: 'veryPoor',
    min: 301,
    max: 400,
    label: 'Very Poor',
    color: '#660099',
    description: 'May cause respiratory illness on prolonged exposure.',
  },
  {
    category: 'severe',
    min: 401,
    max: 500,
    label: 'Severe',
    color: '#7E0023',
    description: 'May cause serious respiratory effects even on healthy people.',
  },
];

/**
 * Returns the AQI category for a given AQI value.
 */
export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'veryPoor';
  return 'severe';
}

/**
 * Returns the CPCB AQI color for a given AQI value.
 */
export function getAQIColor(aqi: number): string {
  const category = getAQICategory(aqi);
  return getAQICategoryColor(category);
}

/**
 * Returns the color hex for a specific AQI category.
 */
export function getAQICategoryColor(category: AQICategory): string {
  const colorMap: Record<AQICategory, string> = {
    good: '#009966',
    satisfactory: '#FFDE33',
    moderate: '#FF9933',
    poor: '#CC0033',
    veryPoor: '#660099',
    severe: '#7E0023',
  };
  return colorMap[category];
}

/**
 * Returns the human-readable label for a given AQI value.
 */
export function getAQILabel(aqi: number): string {
  const category = getAQICategory(aqi);
  return getAQICategoryLabel(category);
}

/**
 * Returns the human-readable label for a category.
 */
export function getAQICategoryLabel(category: AQICategory): string {
  const labelMap: Record<AQICategory, string> = {
    good: 'Good',
    satisfactory: 'Satisfactory',
    moderate: 'Moderate',
    poor: 'Poor',
    veryPoor: 'Very Poor',
    severe: 'Severe',
  };
  return labelMap[category];
}

/**
 * Returns the full breakpoint info for a given AQI value.
 */
export function getAQIBreakpoint(aqi: number): AQIBreakpoint {
  const category = getAQICategory(aqi);
  const breakpoint = AQI_BREAKPOINTS.find((bp) => bp.category === category);
  // Fallback to severe if somehow not found (shouldn't happen)
  return breakpoint ?? AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1];
}

/**
 * Returns the text color class (for readability) based on AQI category background.
 * Some AQI category colors need dark text, some need white text.
 */
export function getAQITextColorClass(category: AQICategory): string {
  switch (category) {
    case 'good':
    case 'poor':
    case 'veryPoor':
    case 'severe':
      return 'text-white';
    case 'satisfactory':
    case 'moderate':
      return 'text-charcoal';
  }
}
