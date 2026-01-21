"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useRef } from "react";

export default function TurnstileCaptcha({ onVerify, onExpire }: any) {
  const ref = useRef<any>(null);

  return (
    <Turnstile
      ref={ref}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={(token) => onVerify(token)}
      onExpire={() => {
        onVerify("");
        onExpire?.();
      }}
      options={{
        theme: "light",
      }}
    />
  );
}
