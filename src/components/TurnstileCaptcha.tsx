"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileCaptcha({ onVerify }: any) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={(token) => onVerify(token)}
      options={{
        theme: "light",
      }}
    />
  );
}
