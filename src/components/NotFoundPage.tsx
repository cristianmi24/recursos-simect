import React from 'react';
import { ArrowLeft, Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => (
  <main className="not-found-page">
    <section className="not-found-card" aria-labelledby="not-found-title">
      <div className="not-found-art" aria-hidden="true">
        <span className="not-found-orb not-found-orb--mint" />
        <span className="not-found-orb not-found-orb--lilac" />
        <span className="not-found-number">404</span>
        <span className="not-found-compass"><Compass /></span>
      </div>
      <p className="not-found-eyebrow">RUTA NO ENCONTRADA</p>
      <h1 id="not-found-title">Esta página tomó otro camino.</h1>
      <p className="not-found-copy">El enlace puede haber cambiado o ya no estar disponible. Vuelve al espacio de trabajo y continúa desde allí.</p>
      <a className="not-found-home" href="/">
        <Home aria-hidden="true" />
        <span>Volver al inicio</span>
        <ArrowLeft className="not-found-home-arrow" aria-hidden="true" />
      </a>
      <p className="not-found-foot">ROCAS <span>·</span> Investigación educativa</p>
    </section>
  </main>
);
