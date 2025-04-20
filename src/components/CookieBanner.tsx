'use client';

import { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    const rejectedAt = localStorage.getItem('cookieRejectedAt');

    if (consent === 'true') {
      setVisible(false);
    } else if (rejectedAt) {
      const dias = 5 * 24 * 60 * 60 * 1000; // 5 dias em ms
      const expirou = Date.now() - parseInt(rejectedAt, 10) > dias;
      if (expirou) {
        localStorage.removeItem('cookieRejectedAt');
        setVisible(true);
      }
    } else {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    localStorage.removeItem('cookieRejectedAt');
    setVisible(false);
  };

  const rejectCookies = () => {
    localStorage.removeItem('cookieConsent');
    localStorage.setItem('cookieRejectedAt', Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 w-full bg-gray-800 text-white p-4 text-sm z-50 shadow-lg flex justify-center">
      <div className="max-w-md text-center">
        <p className="mb-4">
          Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{" "}
          <a href="/politica-de-privacidade" className="underline text-orange-400 hover:text-orange-500">
            Política de Privacidade
          </a>.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={acceptCookies}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold"
          >
            Aceitar
          </button>
          <button
            onClick={rejectCookies}
            className="border border-gray-500 text-gray-300 hover:bg-gray-700 px-4 py-2 rounded text-sm"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
