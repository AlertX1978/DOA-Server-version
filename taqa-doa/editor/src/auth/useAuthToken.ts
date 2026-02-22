import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiTokenRequest, IS_AUTH_CONFIGURED } from './msalConfig';

export function useAuthToken() {
  if (!IS_AUTH_CONFIGURED) {
    return { getToken: async () => null as string | null };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { instance, accounts } = useMsal();

  const getToken = async (): Promise<string | null> => {
    if (accounts.length === 0) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...apiTokenRequest,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect(apiTokenRequest);
        return null;
      }
      console.error('[auth] Token acquisition failed:', err);
      return null;
    }
  };

  return { getToken };
}
