const config = {
  appId: "app.relay.node",
  appName: "Relay",
  webDir: "public",
  server: {
    url: process.env.RELAY_SERVER_URL || undefined,
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
