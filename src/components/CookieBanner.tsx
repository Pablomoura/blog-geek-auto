// src/components/CookieBanner.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookieConsent');
    if (!accepted) setVisible(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 w-full bg-gray-800 text-white p-4 text-sm z-50 flex flex-col sm:flex-row justify-between items-center shadow-lg">
      <p className="mb-2 sm:mb-0">
        Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{" "}
        <a href="/politica-de-privacidade" className="underline text-orange-400 hover:text-orange-500">Política de Privacidade</a>.
      </p>
      <button
        onClick={acceptCookies}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded mt-2 sm:mt-0"
      >
        Aceitar
      </button>
    </div>
  );
}