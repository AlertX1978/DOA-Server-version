import axios from 'axios';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance, IS_AUTH_CONFIGURED, apiTokenRequest } from '../auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  if (!IS_AUTH_CONFIGURED || !msalInstance) return config;

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return config;

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...apiTokenRequest,
      account: accounts[0],
    });
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(apiTokenRequest);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status === 'ok' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      error.message = serverMessage;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
