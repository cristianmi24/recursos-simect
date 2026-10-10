import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { type AuthRole, useAuth } from '../context/AuthContext';

interface LoginPageProps {
  configured: boolean | null;
  offline: boolean;
}

const roleChoices: { id: AuthRole; title: string; description: string; Icon: typeof GraduationCap }[] = [
  {
    id: 'tutor',
    title: 'Tutor',
    description: 'Llenar formularios de investigación',
    Icon: GraduationCap
  },
  {
    id: 'admin',
    title: 'Administración',
    description: 'Gestionar análisis y entregables',
    Icon: ShieldCheck
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ configured, offline }) => {
  const { login, retrySession } = useAuth();
  const [role, setRole] = useState<AuthRole>('tutor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(role, email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const activeRole = roleChoices.find((choice) => choice.id === role)!;

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="SIMECT">
        <div className="auth-story-shade" />
        <div className="auth-brand">
          <div className="auth-mark" aria-hidden="true"><span>S</span><i /></div>
          <div>
            <div className="auth-brand-name">SIMECT <span>STI</span></div>
            <div className="auth-brand-caption">INVESTIGACIÓN EDUCATIVA</div>
          </div>
        </div>

        <div className="auth-story-copy">
          <div className="auth-kicker"><Sparkles size={14} /> MÉTODO, EVIDENCIA Y REFLEXIÓN</div>
          <h1>Comprender el aprendizaje.<br /><em>Con rigor y humanidad.</em></h1>
          <p>Un espacio de trabajo para observar, escuchar y analizar experiencias con Sistemas Tutores Inteligentes.</p>
          <div className="auth-methods" aria-label="Instrumentos de investigación">
            <span>Observación</span><b>·</b><span>Grupo focal</span><b>·</b><span>Entrevista</span>
          </div>
        </div>

        <div className="auth-story-foot">
          <span className="auth-secure-dot" />
          <span>Acceso protegido · SIMECT</span>
          <span className="auth-foot-rule" />
          <span>STI / 2026</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand">
            <div className="auth-mark" aria-hidden="true"><span>S</span><i /></div>
            <div><div className="auth-brand-name">SIMECT <span>STI</span></div><div className="auth-brand-caption">INVESTIGACIÓN EDUCATIVA</div></div>
          </div>
          <div className="auth-panel-overline">PORTAL DE ACCESO <span>01 / 02</span></div>
          <h2>Bienvenido<span className="auth-period">.</span></h2>
          <p className="auth-panel-lead">Selecciona tu perfil para continuar.</p>

          <div className="auth-role-list" role="group" aria-label="Tipo de acceso">
            {roleChoices.map(({ id, title, description, Icon }) => (
              <button
                key={id}
                type="button"
                className={`auth-role-option ${role === id ? 'is-selected' : ''}`}
                onClick={() => { setRole(id); setError(''); }}
                aria-pressed={role === id}
              >
                <span className="auth-role-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <span className="auth-role-text"><strong>{title}</strong><small>{description}</small></span>
                <span className="auth-role-check" aria-hidden="true">{role === id ? '✓' : ''}</span>
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="auth-label" htmlFor="login-email">Correo electrónico</label>
            <div className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="nombre@institucion.edu.co"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-label-row">
              <label className="auth-label" htmlFor="login-password">Contraseña</label>
              <span className="auth-role-hint">Acceso de {activeRole.title.toLowerCase()}</span>
            </div>
            <div className="auth-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}
            {offline && !error && (
              <div className="auth-offline" role="status"><span className="auth-offline-indicator" aria-hidden="true" /><div><strong>Servicio de acceso no disponible</strong><p>Comprueba tu conexión e inténtalo de nuevo.</p><button type="button" onClick={() => void retrySession()}><RefreshCw size={13} aria-hidden="true" /> Reintentar conexión</button></div></div>
            )}
            {configured === false && (
              <div className="auth-setup-note" role="status">La conexión con la base de datos no está configurada en el servidor. Define DATABASE_URL y reinicia el servidor.</div>
            )}

            <button className="auth-submit" type="submit" disabled={busy || configured === false}>
              <span>{busy ? 'Verificando acceso…' : `Entrar como ${activeRole.title.toLowerCase()}`}</span>
              {busy ? <span className="auth-spinner" aria-hidden="true" /> : <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-no-account"><span>¿No tienes una cuenta?</span> Solicita acceso a la coordinación.</div>
          <div className="auth-panel-security"><LockKeyhole size={13} /><span>Conexión protegida</span><span className="auth-security-separator">·</span><span>Tu sesión es privada</span></div>
          <div className="auth-copyright">© 2026 SIMECT · Gestión y análisis cualitativo STI</div>
        </div>
        <div className="auth-mobile-backdrop" aria-hidden="true" />
      </section>
    </main>
  );
};
