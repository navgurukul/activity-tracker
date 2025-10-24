'use client';

/**
 * Google Login Button Component
 * Renders Google Sign-In button with OAuth integration
 */

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleLogin } from '@/hooks/use-google-login';

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { handleGoogleLogin, handleGoogleError, isLoading } = useGoogleLogin();

  useEffect(() => {
    if (typeof window === 'undefined' || !buttonRef.current || isLoading) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    // Wait for Google Identity Services to be available
    const initializeButton = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
          });
        }
      } else {
        // Retry after a short delay
        setTimeout(initializeButton, 100);
      }
    };

    initializeButton();
  }, [handleGoogleLogin, isLoading]);

  if (isLoading) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Loader2 className="animate-spin" />
        Signing in...
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
}
