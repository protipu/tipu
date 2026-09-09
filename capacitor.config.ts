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
      backgroundColor: '#0A0D16',
      showSpinner: true,
      spinnerColor: '#C9A24B',
    },
  },
};

export default config;