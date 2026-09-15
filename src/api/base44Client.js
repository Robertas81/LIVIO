import { supabase } from '@/lib/supabaseClient';
import { SitePhoto, Comment, uploadPublicFile } from '@/lib/supabaseEntities';

// This wrapper mimics the Base44 SDK client API used throughout the app,
// so existing components can work against Supabase with minimal changes.
//
// Components use:
//   base44.entities.SitePhoto.list/get/create/update/delete/filter
//   base44.entities.Comment.filter/create/delete
//   base44.auth.me/loginViaEmailPassword/logout/loginWithProvider/
//         register/verifyOtp/resetPasswordRequest/resetPassword/redirectToLogin
//   base44.integrations.Core.UploadPublicFile
//   base44.functions.invoke

export const base44 = {
  supabase,

  auth: {
    async me() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return {
        id: user.id,
        email: user.email,
        role: profile?.role || 'user',
      };
    },

    async loginViaEmailPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async loginWithProvider(provider, returnTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: returnTo || window.location.origin },
      });
      if (error) throw error;
      return data;
    },

    async register({ email, password }) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },

    async verifyOtp({ email, otpCode }) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (error) throw error;
      return data;
    },

    async resendOtp(email) {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      return data;
    },

    async resetPasswordRequest(email) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return data;
    },

    async resetPassword({ resetToken, newPassword }) {
      // Supabase handles password reset via the session from the recovery link
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    },

    setToken(token) {
      // Supabase manages tokens internally; no-op
    },

    logout(redirectUrl) {
      supabase.auth.signOut().then(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/login';
        }
      });
    },

    redirectToLogin(returnTo) {
      window.location.href = '/login?returnTo=' + encodeURIComponent(returnTo || '/');
    },
  },

  entities: {
    SitePhoto,
    Comment,
  },

  integrations: {
    Core: {
      UploadPublicFile: uploadPublicFile,
    },
  },

  functions: {
    async invoke(name, params) {
      // Google Drive sync is not available without the Base44 backend.
      // Return a graceful message so the UI can inform the user.
      if (name === 'syncGoogleDrivePhotos') {
        return {
          data: {
            error: 'Google Drive sync requires the Base44 backend, which is not available in this environment.',
          },
        };
      }
      throw new Error(`Unknown function: ${name}`);
    },
  },

  app: {
    async getPublicSettings() {
      // No Base44 app settings needed; return a stub.
      return { id: 'local', public_settings: {} };
    },
  },
};
