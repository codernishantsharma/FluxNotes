import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.nishantapps.fluxnotes',
  appName: 'FluxNotes',
  webDir: 'out',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
