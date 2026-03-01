import { Configuration, LogLevel } from '@azure/msal-browser';

/**
 * MSAL configuration for Azure AD / Entra ID authentication.
 *
 * In development mode (VITE_AZURE_CLIENT_ID = 'placeholder'), the app
 * will skip MSAL initialisation entirely and run un-authenticated.
 */

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || 'placeholder';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || 'placeholder';
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:5173';

export const IS_AUTH_CONFIGURED = clientId !== 'placeholder' && tenantId !== 'placeholder';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[msal]', message);
            break;
          case LogLevel.Warning:
            console.warn('[msal]', message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

/**
 * Scopes requested during login / token acquisition.
 * The `api://<clientId>/DOA.Read` scope should match the API scope
 * configured in the Azure AD app registration.
 */
export const loginRequest = {
  scopes: IS_AUTH_CONFIGURED
    ? [`api://${clientId}/DOA.Read`]
    : [],
};

export const apiTokenRequest = {
  scopes: IS_AUTH_CONFIGURED
    ? [`api://${clientId}/DOA.Read`]
    : [],
};
