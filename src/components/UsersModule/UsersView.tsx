import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, GraduationCap, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import type { ManagedUser } from '../../types';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? 'No se pudo completar la operación.');
  return payload as T;
}

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [togglingId, setTogglingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { users: loaded } = await requestJson<{ users: ManagedUser[] }>('/api/admin/users');
      setUsers(loaded);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createTutor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    setBusy(true);
    try {
      const { user } = await requestJson<{ user: ManagedUser }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });
      setUsers((previous) => [...previous, user]);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setNotice(`Cuenta creada para ${user.email}. Comparte la contraseña con el tutor por un canal privado.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (target: ManagedUser) => {
    if (target.isActive && !confirm(`¿Desactivar la cuenta de ${target.name}? Se cerrarán sus sesiones abiertas y no podrá entrar.`)) return;
    setTogglingId(target.id);
    setNotice('');
    try {
      const { user } = await requestJson<{ user: ManagedUser }>(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !target.isActive })
      });
      setUsers((previous) => previous.map((existing) => existing.id === user.id ? user : existing));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setTogglingId('');
    }
  };

  const tutors = users.filter((user) => user.role === 'tutor');
  const admins = users.filter((user) => user.role === 'admin');
  const passwordLength = [...password].length;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
          <Users className="w-3.5 h-3.5" aria-hidden="true" /> Gestión de accesos
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Usuarios y tutores</h1>
        <p className="mt-1 text-sm text-slate-600">Crea las cuentas de los tutores que llenarán los formularios. Cada tutor solo ve sus propios registros.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
        <form onSubmit={createTutor} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><UserPlus className="w-5 h-5" aria-hidden="true" /></span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Nuevo tutor</h2>
              <p className="text-xs text-slate-500">La cuenta queda activa de inmediato.</p>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-700">Nombre para mostrar</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="off" className="mt-1 w-full border px-3 py-2 text-sm" placeholder="Ej. Tutora Grupo 10B" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Correo</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="off" className="mt-1 w-full border px-3 py-2 text-sm" placeholder="tutor@institucion.edu" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Contraseña inicial</span>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" className="w-full border px-3 py-2 pr-10 text-sm" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-800" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className={`mt-1 block text-[11px] ${passwordLength > 0 && passwordLength < 12 ? 'text-rose-700' : 'text-slate-500'}`}>Mínimo 12 caracteres{passwordLength > 0 ? ` · ${passwordLength}/12` : ''}</span>
          </label>

          {formError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{formError}</div>}
          {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{notice}</div>}

          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            <UserPlus className="w-4 h-4" aria-hidden="true" /> {busy ? 'Creando cuenta…' : 'Crear cuenta de tutor'}
          </button>
        </form>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Tutores registrados</h2>
              <p className="text-xs text-slate-500">{tutors.filter((t) => t.isActive).length} activos de {tutors.length}</p>
            </div>
            <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Actualizar
            </button>
          </div>

          {loadError && <div role="alert" className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{loadError}</div>}

          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">Cargando usuarios…</p>
          ) : tutors.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <GraduationCap className="mx-auto w-8 h-8 text-slate-300" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Aún no hay tutores</p>
              <p className="text-xs text-slate-500">Crea la primera cuenta con el formulario.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tutors.map((tutor) => (
                <li key={tutor.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${tutor.isActive ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`} aria-hidden="true">
                    {tutor.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${tutor.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{tutor.name}</p>
                    <p className="truncate text-xs text-slate-500">{tutor.email} · desde {dateFormatter.format(new Date(tutor.createdAt))}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tutor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{tutor.isActive ? 'Activo' : 'Inactivo'}</span>
                  <button type="button" disabled={togglingId === tutor.id} onClick={() => void toggleActive(tutor)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${tutor.isActive ? 'border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}>
                    {tutor.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {admins.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Administración</p>
              <ul className="flex flex-wrap gap-2">
                {admins.map((admin) => (
                  <li key={admin.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" /> {admin.name} <span className="text-slate-400">· {admin.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
