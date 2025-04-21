'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function CookieScripts() {
  const [permitido, setPermitido] = useState(true); // muda para true por padrão

  useEffect(() => {
    const rejeitado = localStorage.getItem('cookieRejectedAt');
    if (rejeitado) {
      setPermitido(false); // só bloqueia se recusou
    }
  }, []);

  if (!permitido) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-SMFR890H32"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SMFR890H32');
        `}
      </Script>
    </>
  );
}
