import { type ReactNode } from 'react';
import { PublicClientApplication, EventType, type EventMessage, type AuthenticationResult } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig, IS_AUTH_CONFIGURED } from './msalConfig';

let msalInstance: PublicClientApplication | null = null;

if (IS_AUTH_CONFIGURED) {
  msalInstance = new PublicClientApplication(msalConfig);

  msalInstance.addEventCallback((event: EventMessage) => {
    if (
      event.eventType === EventType.LOGIN_SUCCESS &&
      (event.payload as AuthenticationResult)?.account
    ) {
      msalInstance!.setActiveAccount(
        (event.payload as AuthenticationResult).account,
      );
    }
  });
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  if (!IS_AUTH_CONFIGURED || !msalInstance) {
    return <>{children}</>;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export { msalInstance };
