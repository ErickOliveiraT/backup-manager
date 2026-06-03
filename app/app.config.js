const base = require('./app.json').expo;

module.exports = {
  expo: {
    ...base,
    android: {
      ...base.android,
      // EAS injects GOOGLE_SERVICES_JSON as a path to the secret file during build.
      // Falls back to the local file for local builds (npx expo run:android).
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
  },
};
