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
      backgroundColor: '#F0F4F8',
      showSpinner: true,
      spinnerColor: '#2563EB',
    },
  },
};

export default config;