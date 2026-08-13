import { useEffect, useRef } from 'react';

/** Set VITE_GOOGLE_CLIENT_ID in client/.env to enable Google sign-in. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/**
 * Google sign-in — "Continue with Google" (Gmail direct login).
 *
 * Two render paths, so the button ALWAYS appears when GOOGLE_CLIENT_ID is set:
 *
 * 1. Official GIS button — loaded from accounts.google.com/gsi/client and
 *    rendered into <div id="google-signin-button">. This is the preferred path
 *    (works with only the Client ID; no redirect URI needed).
 *
 * 2. Fallback button — a plain styled button that appears immediately and is
 *    replaced by the official one when the GIS script loads. If the script is
 *    blocked (offline, strict CSP, sandboxed preview) the fallback handles the
 *    click by opening Google's OAuth page in a popup with
 *    `response_type=id_token` and reading the returned ID token from the
 *    popup's URL hash (same-origin). Requires the app origin to be listed in
 *    the OAuth client's Authorized redirect URIs.
 *
 * @param {(credential: string) => void} onCredential — receives the ID token.
 */
export function useGoogleSignIn(onCredential) {
  const callbackRef = useRef(onCredential);

  // Keep the latest handler without re-initializing the Google button.
  useEffect(() => {
    callbackRef.current = onCredential;
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;
    let scriptTimeout;

    /** Extract the ID token from the popup's URL once it returns to our origin. */
    const startPopupFlow = () => {
      const nonce = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      url.searchParams.set('redirect_uri', window.location.origin);
      url.searchParams.set('response_type', 'id_token');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('nonce', nonce);
      url.searchParams.set('prompt', 'select_account');

      const popup = window.open(url.toString(), 'campus-connect-google', 'width=480,height=640');
      if (!popup) {
        callbackRef.current?.({ __popupBlocked: true });
        return;
      }

      const poll = setInterval(() => {
        try {
          const hash = popup.location.hash;
          if (hash && hash.includes('id_token=')) {
            clearInterval(poll);
            const token = new URLSearchParams(hash.slice(1)).get('id_token');
            popup.close();
            if (token) callbackRef.current?.(token);
          }
        } catch {
          // popup still on accounts.google.com (cross-origin) — keep polling
        }
      }, 500);

      const closeCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(poll);
          clearInterval(closeCheck);
        }
      }, 1000);
    };

    /** Plain button fallback — no external script required. */
    const renderFallback = () => {
      const el = document.getElementById('google-signin-button');
      if (!el || cancelled || el.dataset.fallbackRendered) return;
      el.dataset.fallbackRendered = 'true';
      el.innerHTML = '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute(
        'style',
        'display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;' +
          'border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#1f2937;' +
          'font:500 14px/20px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;' +
          'box-shadow:0 1px 2px rgba(16,24,40,.05);transition:background .15s;',
      );
      btn.addEventListener('mouseenter', () => btn.style.background = '#f9fafb');
      btn.addEventListener('mouseleave', () => btn.style.background = '#fff');
      const logo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      logo.setAttribute('width', '18');
      logo.setAttribute('height', '18');
      logo.setAttribute('viewBox', '0 0 48 48');
      logo.innerHTML =
        '<path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>' +
        '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>' +
        '<path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>' +
        '<path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>';
      btn.appendChild(logo);
      btn.appendChild(document.createTextNode('Continue with Google'));
      btn.addEventListener('click', startPopupFlow);
      el.appendChild(btn);
    };

    /** Official GIS button (preferred). */
    const renderGisButton = () => {
      if (!window.google?.accounts?.id) return false;
      if (!window.__campusGisInitialized) {
        window.__campusGisInitialized = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: (response) => callbackRef.current?.(response.credential),
        });
      }
      const el = document.getElementById('google-signin-button');
      if (el) {
        el.dataset.fallbackRendered = 'true'; // official button replaces fallback
        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width: '100%',
        });
      }
      return true;
    };

    // Show the fallback immediately so a button is ALWAYS visible.
    renderFallback();

    if (!renderGisButton()) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!cancelled) renderGisButton();
      };
      script.onerror = () => {
        // keep the fallback
      };
      document.body.appendChild(script);
      // If the script never loads (blocked/offline), the fallback stays.
      scriptTimeout = setTimeout(() => {
        if (!window.google?.accounts?.id && !cancelled) renderFallback();
      }, 4000);
    }

    return () => {
      cancelled = true;
      clearTimeout(scriptTimeout);
    };
  }, []);
}
