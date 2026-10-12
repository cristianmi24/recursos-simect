import React, { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';

// Aviso discreto cuando se pierde la conexión (habitual con datos móviles en los colegios).
// El formulario en curso se conserva en la pestaña, así que se puede seguir llenando y enviar al volver la red.
export const OfflineNotice: React.FC = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const goOnline = () => {
      setOnline(true);
      setShowBack(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShowBack(false), 4000);
    };
    const goOffline = () => {
      setOnline(false);
      setShowBack(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online && !showBack) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[55] flex justify-center px-3">
      <p className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
        {online ? <Wifi className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        {online
          ? 'Conexión restablecida. Ya puedes enviar.'
          : 'Sin conexión. Puedes seguir llenando el formulario: se conserva en esta pestaña y lo envías cuando vuelva la señal.'}
      </p>
    </div>
  );
};
