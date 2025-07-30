// @types/react-google-recaptcha.d.ts
declare module 'react-google-recaptcha' {
  import { ComponentType } from 'react';

  interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal' | 'invisible';
    tabindex?: number;
    hl?: string; // til kodi: 'uz', 'ru', 'en'
  }

  const ReCAPTCHA: ComponentType<ReCAPTCHAProps>;
  export default ReCAPTCHA;
}