import React, { useCallback, useEffect, useState } from 'react';
import { useDialog } from '../DialogProvider';
import { CalendarClock, Eye, EyeOff, GraduationCap, LogIn, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateFormat';
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


type Role = ManagedUser['role'];
const ROLE_INFO: Record<Role, { label: string; plural: string; description: string }> = {
  tutor: { label: 'Tutor', plural: 'Tutores', description: 'Llena formularios y solo ve los suyos.' },
  admin: { label: 'Administración', plural: 'Administración', description: 'Acceso completo: ve, edita y borra formularios de todos, y crea cuentas.' }
};

export const UsersView: React.FC = () => {
  const dialog = useDialog();
  const currentUserId = useAuth().user?.id;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [role, setRole] = useState<Role>('tutor');
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

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    if (role === 'admin' && !(await dialog.confirm({
      title: '¿Crear una cuenta de administración?',
      message: `${name.trim() || 'Esta persona'} tendrá acceso completo: podrá ver, editar y borrar los formularios y audios de todos los tutores, y crear o desactivar cuentas.`,
      confirmLabel: 'Crear administración'
    }))) return;
    setBusy(true);
    try {
      const { user } = await requestJson<{ user: ManagedUser }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role })
      });
      setUsers((previous) => [...previous, { loginCount: 0, hasOpenSession: false, ...user }]);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setNotice(`Cuenta de ${ROLE_INFO[user.role].label.toLowerCase()} creada para ${user.email}. Comparte la contraseña por un canal privado.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (target: ManagedUser) => {
    if (target.isActive && !(await dialog.confirm({
      title: `¿Desactivar la cuenta de ${target.name}?`,
      message: 'Se cerrarán sus sesiones abiertas y no podrá entrar hasta que la vuelvas a activar.',
      confirmLabel: 'Desactivar cuenta',
      tone: 'danger'
    }))) return;
    setTogglingId(target.id);
    setNotice('');
    setLoadError('');
    try {
      const { user } = await requestJson<{ user: ManagedUser }>(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !target.isActive })
      });
      setUsers((previous) => previous.map((existing) => existing.id === user.id
        ? { ...existing, ...user, hasOpenSession: user.isActive ? existing.hasOpenSession : false }
        : existing));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setTogglingId('');
    }
  };

  const passwordLength = [...password].length;
  const groups = (['tutor', 'admin'] as Role[]).map((groupRole) => ({
    role: groupRole,
    members: users.filter((user) => user.role === groupRole)
  }));

  const renderUser = (member: ManagedUser) => {
    const isSelf = member.id === currentUserId;
    return (
      <li key={member.id} className="flex flex-wrap items-start gap-3 px-6 py-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${!member.isActive ? 'bg-slate-100 text-slate-400' : member.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`} aria-hidden="true">
          {member.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`truncate text-sm font-bold ${member.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{member.name}</p>
            {isSelf && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">Tú</span>}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${member.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{member.isActive ? 'Activa' : 'Inactiva'}</span>
            {member.hasOpenSession && member.isActive && <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800"><span className="h-1.5 w-1.5 rounded-full bg-sky-600" aria-hidden="true" />Sesión abierta</span>}
          </div>
          <p className="truncate text-xs text-slate-500">{member.email}</p>
          <dl className="grid gap-x-4 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-2">
            <div className="flex gap-1"><dt className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-slate-500"><LogIn className="h-3.5 w-3.5" aria-hidden="true" />Último ingreso:</dt><dd>{member.lastLoginAt ? formatDateTime(member.lastLoginAt) : 'Nunca ha entrado'}</dd></div>
            <div className="flex gap-1"><dt className="whitespace-nowrap font-semibold text-slate-500">Ingresos:</dt><dd>{member.loginCount ?? 0}</dd></div>
            <div className="flex gap-1 sm:col-span-2"><dt className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-slate-500"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />Cuenta creada:</dt><dd>{formatDateTime(member.createdAt)}</dd></div>
          </dl>
        </div>
        {!isSelf && (
          <button type="button" disabled={togglingId === member.id} onClick={() => void toggleActive(member)} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 ${member.isActive ? 'border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}>
            {member.isActive ? 'Desactivar' : 'Reactivar'}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
          <Users className="w-3.5 h-3.5" aria-hidden="true" /> Gestión de accesos
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">Crea cuentas de tutores o de administración y revisa cuándo entró cada persona.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
        <form onSubmit={(event) => void createUser(event)} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><UserPlus className="w-5 h-5" aria-hidden="true" /></span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Nueva cuenta</h2>
              <p className="text-xs text-slate-500">La cuenta queda activa de inmediato.</p>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-bold text-slate-700">Tipo de cuenta</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(['tutor', 'admin'] as Role[]).map((option) => (
                <label key={option} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold ${role === option ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="new-user-role" value={option} checked={role === option} onChange={() => setRole(option)} className="sr-only" />
                  {option === 'admin' ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <GraduationCap className="h-4 w-4" aria-hidden="true" />}
                  {ROLE_INFO[option].label}
                </label>
              ))}
            </div>
            <p className={`mt-2 text-[11px] ${role === 'admin' ? 'text-amber-800' : 'text-slate-500'}`}>{ROLE_INFO[role].description}</p>
          </fieldset>

          <label className="block">
            <span className="text-xs font-bold text-slate-700">Nombre para mostrar</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="off" className="mt-1 w-full border px-3 py-2 text-sm" placeholder={role === 'admin' ? 'Ej. Coordinación de investigación' : 'Ej. Tutora Grupo 10B'} />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Correo</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="off" className="mt-1 w-full border px-3 py-2 text-sm" placeholder="persona@institucion.edu" />
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

          <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            <UserPlus className="w-4 h-4" aria-hidden="true" /> {busy ? 'Creando cuenta…' : `Crear cuenta de ${ROLE_INFO[role].label.toLowerCase()}`}
          </button>
        </form>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Cuentas registradas</h2>
              <p className="text-xs text-slate-500">{users.filter((u) => u.isActive).length} activas de {users.length} · horas en formato de 12 horas</p>
            </div>
            <button type="button" onClick={() => void load()} className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Actualizar
            </button>
          </div>

          {loadError && <div role="alert" className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{loadError}</div>}

          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">Cargando usuarios…</p>
          ) : groups.map(({ role: groupRole, members }) => (
            <div key={groupRole} className="border-b border-slate-100 last:border-b-0">
              <h3 className="flex items-center gap-2 bg-slate-50/70 px-6 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {groupRole === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />}
                {ROLE_INFO[groupRole].plural} · {members.filter((m) => m.isActive).length} activas de {members.length}
              </h3>
              {members.length === 0
                ? <p className="px-6 py-6 text-center text-xs text-slate-500">Aún no hay cuentas de {ROLE_INFO[groupRole].label.toLowerCase()}. Créala con el formulario.</p>
                : <ul className="divide-y divide-slate-100">{members.map(renderUser)}</ul>}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
