// components/Recaptcha.tsx
import ReCAPTCHA from "react-google-recaptcha";

const Recaptcha = ({ onChange }: { onChange: (value: string | null) => void }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>

<ReCAPTCHA
  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
  onChange={(val) => {
    onChange(val);
  }}
  onExpired={() => {
    onChange(null);
  }}
  hl="uz"
/>
    </div>
  );
};

export default Recaptcha;