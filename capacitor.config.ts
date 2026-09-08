import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.protipu.tipu',
  appName: 'Tipu',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1612',
      showSpinner: true,
      spinnerColor: '#D4A843',
    },
  },
};

export default config;