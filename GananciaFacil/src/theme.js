const light = {
  background: '#F5F4EE',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF4',
  text: '#181B27',
  secondary: '#5E6472',
  separator: '#D9DCE5',
  tint: '#3848C8',
  tintSoft: '#E9EBFF',
  dateMark: '#B94732',
  dateMarkSoft: '#F8EAE5',
  positive: '#176D4A',
  positiveSoft: '#E6F3EC',
  negative: '#AE352E',
  negativeSoft: '#F9E9E7',
  barTrack: '#E0E3EA',
  field: '#FFFFFF',
  placeholder: '#5E6472',
  onTint: '#FFFFFF',
};

const dark = {
  background: '#11131B',
  surface: '#1B1E29',
  surfaceMuted: '#252A37',
  text: '#F3F4F7',
  secondary: '#A5AAB7',
  separator: '#343947',
  tint: '#B7C0FF',
  tintSoft: '#292F52',
  dateMark: '#FF9A78',
  dateMarkSoft: '#402820',
  positive: '#6BD6A0',
  positiveSoft: '#183A2E',
  negative: '#FF8B83',
  negativeSoft: '#482727',
  barTrack: '#333847',
  field: '#202431',
  placeholder: '#9AA0AE',
  onTint: '#11131B',
};

export function paletteFor(scheme) {
  return scheme === 'dark' ? dark : light;
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  control: 14,
};
