import { useColorScheme } from 'react-native';
import { useLocal } from './storage';
import { useData } from './data';
const dark = {
  bg: '#101827',
  surface: '#192638',
  raised: '#223349',
  text: '#F8F6F0',
  muted: '#A6B6C7',
  line: '#304055',
  teal: '#12B8A6',
  gold: '#FFB454',
  danger: '#FFADA0',
};
const light = {
  ...dark,
  bg: '#F8F6F0',
  surface: '#FFFFFF',
  raised: '#E6EEEB',
  text: '#101827',
  muted: '#506375',
  line: '#D7E1DE',
  teal: '#087E73',
  gold: '#926019',
  danger: '#B43525',
};
export function useTheme() {
  const { state } = useLocal();
  const { city } = useData();
  const system = useColorScheme();
  return state.theme === 'light' ||
    (state.theme === 'system' && system === 'light')
    ? light
    : {
        ...dark,
        bg: city?.theme?.background || dark.bg,
        teal: city?.theme?.accent || dark.teal,
      };
}
