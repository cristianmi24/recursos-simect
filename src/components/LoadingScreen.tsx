import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsTakingLong(true), 10_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <section className="loading-card" aria-label="Carga de SIMECT">
        <div className="loading-brand-mark" aria-hidden="true">S</div>
        <div className="loading-spinner" aria-hidden="true" />
        <p className="loading-brand-name">SIMECT <span>STI</span></p>
        <h1>{message}</h1>
        <div className="loading-progress" aria-hidden="true"><span /></div>
        <p className="loading-hint">
          {isTakingLong
            ? 'La carga está tardando más de lo esperado. Mantén esta página abierta.'
            : 'Estamos preparando tu espacio de trabajo…'}
        </p>
      </section>
    </main>
  );
};
