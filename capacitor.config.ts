import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sandy.suzuai',
  appName: 'Suzu AI',
  webDir: 'dist',
  server: {
    // For development — point to your running backend
    // For production — comment this out and use your deployed backend URL
    // androidScheme: 'https',
    // url: 'https://your-backend.com',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#060612',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;