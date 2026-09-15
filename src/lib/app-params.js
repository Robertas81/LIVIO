// App parameters for the Supabase-backed app.
// Previously this read Base44 SDK tokens; now it just provides env vars
// that the Supabase client and other code may need.

export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID || '',
  token: null,
  functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || '',
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || '',
};
