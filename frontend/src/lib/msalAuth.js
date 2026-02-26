/**
 * MSAL (Microsoft Authentication Library) configuration for Azure AD.
 * This module is only active when the backend reports azure_ad_enabled = true.
 */
import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

let msalInstance = null;
let msalConfig = null;

/**
 * Fetch auth config from the backend, then initialise MSAL.
 */
export async function initMsal() {
  try {
    const res = await fetch('/api/config/auth');
    const config = await res.json();

    if (!config.azure_ad_enabled || !config.client_id || !config.tenant_id) {
      return null; // Azure AD is off — the app will use local JWT auth
    }

    msalConfig = config;

    const msalCfg = {
      auth: {
        clientId: config.client_id,
        authority: `https://login.microsoftonline.com/${config.tenant_id}`,
        redirectUri: config.redirect_uri || window.location.origin,
        postLogoutRedirectUri: config.redirect_uri || window.location.origin,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
      system: {
        loggerOptions: {
          logLevel: LogLevel.Warning,
          loggerCallback: (level, message) => {
            if (level === LogLevel.Error) console.error('[MSAL]', message);
          },
        },
      },
    };

    msalInstance = new PublicClientApplication(msalCfg);
    await msalInstance.initialize();

    // Handle redirect response
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      msalInstance.setActiveAccount(response.account);
    }

    return msalInstance;
  } catch (err) {
    console.error('[MSAL] Init failed:', err);
    return null;
  }
}

export function getMsalInstance() {
  return msalInstance;
}

export function getMsalConfig() {
  return msalConfig;
}

/**
 * Acquire a token silently, or fall back to popup.
 */
export async function acquireToken() {
  if (!msalInstance || !msalConfig) return null;

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;

  const request = {
    scopes: msalConfig.scopes || [`api://${msalConfig.client_id}/access_as_user`],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch {
    try {
      const response = await msalInstance.acquireTokenPopup(request);
      return response.accessToken;
    } catch (err) {
      console.error('[MSAL] Token acquisition failed:', err);
      return null;
    }
  }
}

/**
 * Login via redirect to Microsoft login page.
 */
export async function loginWithAzureAd() {
  if (!msalInstance || !msalConfig) return null;

  const request = {
    scopes: msalConfig.scopes || [`api://${msalConfig.client_id}/access_as_user`],
  };

  try {
    const response = await msalInstance.loginPopup(request);
    msalInstance.setActiveAccount(response.account);
    return {
      token: response.accessToken,
      user: {
        email: response.account.username,
        full_name: response.account.name || response.account.username,
        role: 'viewer', // Role is assigned server-side
      },
    };
  } catch (err) {
    console.error('[MSAL] Login failed:', err);
    throw err;
  }
}

/**
 * Logout.
 */
export async function logoutAzureAd() {
  if (!msalInstance) return;
  await msalInstance.logoutPopup();
}
