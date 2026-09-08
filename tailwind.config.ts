import { heroui } from '@heroui/react';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      almostBlack: '#171717',
      almostWhite: '#ededed'
    }
  },
  darkMode: 'class',
  plugins: [heroui()]
};
export default config;
