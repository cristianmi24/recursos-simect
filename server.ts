import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_SESSION_BYTES, parseJsonObject, validateSessionDraft } from './server/researchData';
import type { AuditLogEntry, ManagedUser, ResearchSession } from './src/types';

type Role = 'tutor' | 'admin';
type AuthUser = { id: string; name: string; email: string; role: Role };
type UserRow = {
  id: string;
  display_name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
};
type AuditAction = AuditLogEntry['action'];
type AuditEntity = AuditLogEntry['entityType'];

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL?.trim();
const sql = databaseUrl ? neon(databaseUrl) : null;
const configuredOrigin = process.env.APP_ORIGIN?.trim().replace(/\/$/, '');
// En Vercel, los dominios del despliegue se aceptan automáticamente; APP_ORIGIN solo hace falta para un dominio propio.
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL]
  .map((host) => host?.trim())
  .filter((host): host is string => Boolean(host))
  .map((host) => `https://${host}`);
const trustedOrigins = new Set([configuredOrigin, ...vercelOrigins].filter((origin): origin is string => Boolean(origin)));
const sessionHours = 8;
const sessionMaxAgeSeconds = sessionHours * 60 * 60;
const cookieName = isProduction ? '__Host-rocas_session' : 'rocas_session';
const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12);
const here = dirname(fileURLToPath(import.meta.url));
const sessionListLimit = 1000;
const auditListLimit = 500;

if (isProduction && !databaseUrl) throw new Error('DATABASE_URL es obligatorio en producción.');
if (isProduction && trustedOrigins.size === 0) throw new Error('APP_ORIGIN es obligatorio en producción fuera de Vercel.');
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  if (!Number.isInteger(hops) || hops < 1) throw new Error('TRUST_PROXY debe ser un número entero positivo o quedar sin configurar.');
}

const app = express();
app.disable('x-powered-by');
// En Vercel hay un proxy delante: sin esto, el límite de intentos trataría a todos los usuarios como una sola IP.
const isVercel = Boolean(process.env.VERCEL);
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
else if (isVercel) app.set('trust proxy', 1);
app.use(helmet());
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '1mb', strict: true }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' }
});
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Se alcanzó el límite temporal de operaciones. Inténtalo más tarde.' }
});

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSessionToken(req: Request): string | null {
  const rawCookies = req.headers.cookie;
  if (!rawCookies) return null;
  const cookie = rawCookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  if (!cookie) return null;
  const token = cookie.slice(cookieName.length + 1);
  return /^[A-Za-z0-9_-]{40,64}$/.test(token) ? token : null;
}

function setSessionCookie(res: Response, token: string): void {
  const secure = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionMaxAgeSeconds}${secure}`);
}

function clearSessionCookie(res: Response): void {
  const secure = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

function allowSameOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get('origin');
  const allowedOrigins = new Set(trustedOrigins);
  if (!isProduction) {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://127.0.0.1:3000');
  }
  if (!origin || !allowedOrigins.has(origin.replace(/\/$/, ''))) {
    res.status(403).json({ error: 'Origen de solicitud no permitido.' });
    return;
  }
  if (req.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    res.status(415).json({ error: 'Se requiere una solicitud JSON.' });
    return;
  }
  next();
}

function serializeUser(row: Pick<UserRow, 'id' | 'display_name' | 'email' | 'role'>): AuthUser {
  return { id: row.id, name: row.display_name, email: row.email, role: row.role };
}

async function findSessionUser(req: Request): Promise<AuthUser | null> {
  if (!sql) return null;
  const token = readSessionToken(req);
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.display_name, u.email, u.role
    FROM auth_sessions AS s
    JOIN auth_users AS u ON u.id = s.user_id
    WHERE s.session_token_hash = ${sha256(token)}
      AND s.revoked_at IS NULL AND s.expires_at > NOW() AND u.is_active = TRUE
    LIMIT 1
  `;
  const row = rows[0] as Pick<UserRow, 'id' | 'display_name' | 'email' | 'role'> | undefined;
  return row ? serializeUser(row) : null;
}

async function requireUser(req: Request, res: Response): Promise<AuthUser | null> {
  if (!sql) {
    res.status(503).json({ error: 'La base Neon no está configurada.' });
    return null;
  }
  try {
    const user = await findSessionUser(req);
    if (user) return user;
    if (readSessionToken(req)) clearSessionCookie(res);
    res.status(401).json({ error: 'Inicia sesión para continuar.' });
    return null;
  } catch (error) {
    console.error('No se pudo validar el acceso a datos.', error instanceof Error ? error.message : 'Error desconocido');
    res.status(503).json({ error: 'No se pudo verificar el acceso en este momento.' });
    return null;
  }
}

function requireAdmin(user: AuthUser, res: Response): boolean {
  if (user.role === 'admin') return true;
  res.status(403).json({ error: 'Esta operación requiere el rol de administración.' });
  return false;
}

function isoTimestamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function sessionFromRow(row: Record<string, unknown>): ResearchSession {
  const payload = parseJsonObject(row.payload) ?? {};
  return {
    ...payload,
    id: String(row.id),
    instrumentType: String(row.instrument_type) as ResearchSession['instrumentType'],
    instrumentCode: String(row.instrument_code),
    date: String(row.application_date).slice(0, 10),
    researcherName: String(row.owner_name ?? ''),
    createdAt: isoTimestamp(row.created_at),
    updatedAt: isoTimestamp(row.updated_at)
  } as ResearchSession;
}

async function writeAuditEvent(
  user: AuthUser,
  event: Pick<AuditLogEntry, 'action' | 'entityType' | 'entityId' | 'summary'>,
  details: Record<string, unknown> = {}
): Promise<AuditLogEntry | null> {
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO researcher_audit_log (actor_id, action, entity_type, entity_id, summary, details)
    VALUES (${user.id}, ${event.action}, ${event.entityType}, ${event.entityId.slice(0, 120)}, ${event.summary.slice(0, 500)}, ${JSON.stringify(details)}::jsonb)
    RETURNING id, created_at
  `;
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    timestamp: isoTimestamp(rows[0].created_at),
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId.slice(0, 120),
    researcher: user.name,
    summary: event.summary.slice(0, 500),
    ...(Object.keys(details).length ? { details } : {})
  };
}

function auditEntryFromRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: String(row.id),
    timestamp: isoTimestamp(row.created_at),
    action: String(row.action) as AuditAction,
    entityType: String(row.entity_type) as AuditEntity,
    entityId: String(row.entity_id),
    researcher: String(row.researcher),
    summary: String(row.summary),
    ...(parseJsonObject(row.details) ? { details: parseJsonObject(row.details) as Record<string, unknown> } : {})
  };
}

function responseError(res: Response, error: unknown, safeMessage: string): void {
  console.error(safeMessage, error instanceof Error ? error.message : 'Error desconocido');
  res.status(503).json({ error: safeMessage });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, authConfigured: Boolean(sql) });
});

app.get('/api/auth/session', async (req, res) => {
  if (!sql) {
    res.json({ user: null, configured: false });
    return;
  }
  try {
    const user = await findSessionUser(req);
    if (!user && readSessionToken(req)) clearSessionCookie(res);
    res.json({ user, configured: true });
  } catch (error) {
    responseError(res, error, 'No se pudo verificar la sesión en este momento.');
  }
});

app.post('/api/auth/login', loginLimiter, allowSameOrigin, async (req, res) => {
  if (!sql) {
    res.status(503).json({ error: 'La autenticación aún no está configurada. Conecta Neon para continuar.' });
    return;
  }
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const requestedRole = req.body?.role;
  if (
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    Buffer.byteLength(password, 'utf8') > 72 || password.length === 0 ||
    (requestedRole !== 'tutor' && requestedRole !== 'admin')
  ) {
    res.status(400).json({ error: 'Revisa el correo, la contraseña y el tipo de acceso.' });
    return;
  }
  try {
    const rows = await sql`
      SELECT id, display_name, email, password_hash, role, is_active
      FROM auth_users WHERE email = ${email} LIMIT 1
    `;
    const user = rows[0] as UserRow | undefined;
    const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? dummyPasswordHash);
    if (!user || !user.is_active || user.role !== requestedRole || !passwordMatches) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos, o acceso no habilitado.' });
      return;
    }
    const previousToken = readSessionToken(req);
    if (previousToken) {
      await sql`UPDATE auth_sessions SET revoked_at = NOW() WHERE session_token_hash = ${sha256(previousToken)} AND revoked_at IS NULL`;
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();
    await sql`INSERT INTO auth_sessions (user_id, session_token_hash, expires_at) VALUES (${user.id}, ${sha256(token)}, ${expiresAt})`;
    setSessionCookie(res, token);
    res.json({ user: serializeUser(user), expiresIn: sessionMaxAgeSeconds });
  } catch (error) {
    responseError(res, error, 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
  }
});

app.post('/api/auth/logout', allowSameOrigin, async (req, res) => {
  const token = readSessionToken(req);
  clearSessionCookie(res);
  if (!sql) {
    res.status(503).json({ error: 'No se pudo confirmar el cierre de sesión con el servidor.' });
    return;
  }
  try {
    if (token) {
      await sql`UPDATE auth_sessions SET revoked_at = NOW() WHERE session_token_hash = ${sha256(token)} AND revoked_at IS NULL`;
    }
    res.json({ ok: true });
  } catch (error) {
    responseError(res, error, 'No se pudo confirmar el cierre de sesión con el servidor.');
  }
});

app.get('/api/sessions', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  try {
    const [countRows, rows] = user.role === 'admin'
      ? await Promise.all([
          sql`SELECT count(*)::int AS total FROM research_sessions`,
          sql`
            SELECT s.id, s.instrument_type, s.instrument_code, s.application_date,
                   s.payload, s.created_at, s.updated_at, u.display_name AS owner_name
            FROM research_sessions AS s JOIN auth_users AS u ON u.id = s.owner_id
            ORDER BY s.created_at DESC, s.id DESC LIMIT ${sessionListLimit}
          `
        ])
      : await Promise.all([
          sql`SELECT count(*)::int AS total FROM research_sessions WHERE owner_id = ${user.id}`,
          sql`
            SELECT s.id, s.instrument_type, s.instrument_code, s.application_date,
                   s.payload, s.created_at, s.updated_at, u.display_name AS owner_name
            FROM research_sessions AS s JOIN auth_users AS u ON u.id = s.owner_id
            WHERE s.owner_id = ${user.id}
            ORDER BY s.created_at DESC, s.id DESC LIMIT ${sessionListLimit}
          `
        ]);
    const total = Number(countRows[0]?.total ?? 0);
    res.json({ sessions: rows.map((row) => sessionFromRow(row as Record<string, unknown>)), total, truncated: total > sessionListLimit });
  } catch (error) {
    responseError(res, error, 'No se pudieron cargar los formularios autorizados.');
  }
});

app.post('/api/sessions', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  const validation = validateSessionDraft(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const draft = validation.value;
  const payload = {
    instrumentType: draft.instrumentType,
    date: draft.date,
    institution: draft.institution,
    grade: draft.grade,
    sessionNumber: draft.sessionNumber,
    stiVersionOrTask: draft.stiVersionOrTask,
    ...(draft.studentPseudonym ? { studentPseudonym: draft.studentPseudonym } : {}),
    ...(draft.participantPseudonyms ? { participantPseudonyms: draft.participantPseudonyms } : {}),
    ...(draft.sessionDurationMinutes ? { sessionDurationMinutes: draft.sessionDurationMinutes } : {}),
    recordingConsentApproved: true,
    ...(draft.audioRecordingRef ? { audioRecordingRef: draft.audioRecordingRef } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    ...(draft.observationRecords ? { observationRecords: draft.observationRecords } : {}),
    ...(draft.focusGroupRecords ? { focusGroupRecords: draft.focusGroupRecords } : {}),
    ...(draft.interviewRecords ? { interviewRecords: draft.interviewRecords } : {})
  };
  try {
    let created: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      const year = new Date().getUTCFullYear();
      const instrumentCode = `${draft.instrumentType}-${year}-${randomInt(100000, 1000000)}`;
      const rows = await sql`
        INSERT INTO research_sessions (owner_id, instrument_type, instrument_code, application_date, payload)
        VALUES (${user.id}, ${draft.instrumentType}, ${instrumentCode}, ${draft.date}, ${JSON.stringify(payload)}::jsonb)
        ON CONFLICT (instrument_code) DO NOTHING
        RETURNING id, instrument_type, instrument_code, application_date, payload, created_at, updated_at
      `;
      if (rows[0]) created = { ...(rows[0] as Record<string, unknown>), owner_name: user.name };
    }
    if (!created) {
      res.status(503).json({ error: 'No se pudo generar un código de sesión único. Inténtalo otra vez.' });
      return;
    }
    const session = sessionFromRow(created);
    let auditEvent: AuditLogEntry | null = null;
    try {
      auditEvent = await writeAuditEvent(user, {
        action: 'create_session', entityType: 'session', entityId: session.id,
        summary: `Nueva sesión registrada: ${session.instrumentCode} (${session.instrumentType})`
      });
    } catch (auditError) {
      console.error('No se pudo registrar el evento de creación.', auditError instanceof Error ? auditError.message : 'Error desconocido');
    }
    res.status(201).json({ session, auditEvent });
  } catch (error) {
    responseError(res, error, 'No se pudo guardar el formulario. Conserva tus respuestas e inténtalo de nuevo.');
  }
});

app.put('/api/sessions/:id', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    res.status(400).json({ error: 'El identificador de sesión no es válido.' });
    return;
  }
  const validation = validateSessionDraft(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }
  try {
    const existingRows = await sql`
      SELECT s.id, s.owner_id, s.instrument_type, s.instrument_code, s.application_date,
             s.payload, s.created_at, s.updated_at, u.display_name AS owner_name
      FROM research_sessions AS s JOIN auth_users AS u ON u.id = s.owner_id
      WHERE s.id = ${req.params.id}::uuid LIMIT 1
    `;
    const existing = existingRows[0] as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'No se encontró la sesión.' });
      return;
    }
    if (user.role !== 'admin' && String(existing.owner_id) !== user.id) {
      res.status(403).json({ error: 'Solo puedes editar formularios que enviaste desde tu cuenta.' });
      return;
    }
    const draft = validation.value;
    if (draft.instrumentType !== existing.instrument_type) {
      res.status(400).json({ error: 'No se puede cambiar el tipo de un instrumento ya registrado.' });
      return;
    }
    const payload = {
      instrumentType: draft.instrumentType,
      date: draft.date,
      institution: draft.institution,
      grade: draft.grade,
      sessionNumber: draft.sessionNumber,
      stiVersionOrTask: draft.stiVersionOrTask,
      ...(draft.studentPseudonym ? { studentPseudonym: draft.studentPseudonym } : {}),
      ...(draft.participantPseudonyms ? { participantPseudonyms: draft.participantPseudonyms } : {}),
      ...(draft.sessionDurationMinutes ? { sessionDurationMinutes: draft.sessionDurationMinutes } : {}),
      recordingConsentApproved: true,
      ...(draft.audioRecordingRef ? { audioRecordingRef: draft.audioRecordingRef } : {}),
      ...(draft.notes ? { notes: draft.notes } : {}),
      ...(draft.observationRecords ? { observationRecords: draft.observationRecords } : {}),
      ...(draft.focusGroupRecords ? { focusGroupRecords: draft.focusGroupRecords } : {}),
      ...(draft.interviewRecords ? { interviewRecords: draft.interviewRecords } : {})
    };
    const rows = await sql`
      UPDATE research_sessions SET application_date = ${draft.date}, payload = ${JSON.stringify(payload)}::jsonb, updated_at = NOW()
      WHERE id = ${req.params.id}::uuid
      RETURNING id, instrument_type, instrument_code, application_date, payload, created_at, updated_at
    `;
    const updatedRow = rows[0] as Record<string, unknown> | undefined;
    if (!updatedRow) {
      res.status(404).json({ error: 'No se encontró la sesión.' });
      return;
    }
    const updated = sessionFromRow({ ...updatedRow, owner_name: existing.owner_name });
    let auditEvent: AuditLogEntry | null = null;
    try {
      auditEvent = await writeAuditEvent(user, {
        action: 'update_session', entityType: 'session', entityId: updated.id,
        summary: `Sesión actualizada: ${updated.instrumentCode}`
      });
    } catch (auditError) {
      console.error('No se pudo registrar el evento de actualización.', auditError instanceof Error ? auditError.message : 'Error desconocido');
    }
    res.json({ session: updated, auditEvent });
  } catch (error) {
    responseError(res, error, 'No se pudo actualizar la sesión.');
  }
});

app.delete('/api/sessions/:id', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    res.status(400).json({ error: 'El identificador de sesión no es válido.' });
    return;
  }
  try {
    const rows = await sql`
      WITH deleted AS (
        DELETE FROM research_sessions WHERE id = ${req.params.id}::uuid
        RETURNING id, instrument_code, instrument_type
      ), audit AS (
        INSERT INTO researcher_audit_log (actor_id, action, entity_type, entity_id, summary, details)
        SELECT ${user.id}::uuid, 'delete_session', 'session', deleted.id::text,
          'Sesión retirada: ' || deleted.instrument_code || ' (' || deleted.instrument_type || ')', '{}'::jsonb
        FROM deleted
        RETURNING id, created_at, actor_id, action, entity_type, entity_id, summary, details
      )
      SELECT audit.id, audit.created_at, audit.action, audit.entity_type, audit.entity_id,
        user_row.display_name AS researcher, audit.summary, audit.details
      FROM audit
      JOIN auth_users AS user_row ON user_row.id = audit.actor_id
    `;
    const auditRow = rows[0] as Record<string, unknown> | undefined;
    if (!auditRow) {
      res.status(404).json({ error: 'No se encontró la sesión.' });
      return;
    }
    res.json({ ok: true, auditEvent: auditEntryFromRow(auditRow) });
  } catch (error) {
    responseError(res, error, 'No se pudo retirar la sesión.');
  }
});

app.get('/api/admin/project-state', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  try {
    const rows = await sql`SELECT version, state FROM rocas_project_state WHERE project_key = 'rocas' LIMIT 1`;
    if (!rows[0]) {
      res.json({ state: null, version: 0 });
      return;
    }
    res.json({ state: parseJsonObject(rows[0].state), version: Number(rows[0].version) });
  } catch (error) {
    responseError(res, error, 'No se pudo cargar el estado administrativo.');
  }
});

app.put('/api/admin/project-state', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  const body = isPlainRecord(req.body) ? req.body : null;
  const state = body && isPlainRecord(body.state) ? body.state : null;
  const expectedVersion = body?.expectedVersion;
  if (!state || !Number.isSafeInteger(expectedVersion) || Number(expectedVersion) < 0) {
    res.status(400).json({ error: 'El documento administrativo no es válido.' });
    return;
  }
  const allowedKeys = ['categories', 'codedFragments', 'triangulationEntries'];
  if (Object.keys(state).some((key) => !allowedKeys.includes(key)) || allowedKeys.some((key) => !Array.isArray(state[key]))) {
    res.status(400).json({ error: 'El documento debe contener únicamente las matrices administrativas esperadas.' });
    return;
  }
  if (
    (state.categories as unknown[]).length > 1000 ||
    (state.codedFragments as unknown[]).length > 20000 ||
    (state.triangulationEntries as unknown[]).length > 10000 ||
    Buffer.byteLength(JSON.stringify(state), 'utf8') > 800 * 1024
  ) {
    res.status(413).json({ error: 'El documento administrativo supera el tamaño permitido.' });
    return;
  }
  try {
    const version = Number(expectedVersion);
    const rows = await sql`
      INSERT INTO rocas_project_state (project_key, version, state, updated_by)
      VALUES ('rocas', 1, ${JSON.stringify(state)}::jsonb, ${user.id}::uuid)
      ON CONFLICT (project_key) DO UPDATE
      SET state = EXCLUDED.state,
          version = rocas_project_state.version + 1,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      WHERE rocas_project_state.version = ${version}
      RETURNING version
    `;
    if (!rows[0]) {
      res.status(409).json({ error: 'Otro administrador guardó cambios nuevos. Exporta tus cambios locales y vuelve a cargar antes de continuar.' });
      return;
    }
    res.json({ version: Number(rows[0].version) });
  } catch (error) {
    responseError(res, error, 'No se pudieron guardar los cambios administrativos.');
  }
});

app.get('/api/admin/audit', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  try {
    const rows = await sql`
      SELECT a.id, a.action, a.entity_type, a.entity_id, a.summary, a.details, a.created_at,
             u.display_name AS researcher
      FROM researcher_audit_log AS a JOIN auth_users AS u ON u.id = a.actor_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT ${auditListLimit}
    `;
    res.json({ auditLogs: rows.map((row) => auditEntryFromRow(row as Record<string, unknown>)), limit: auditListLimit });
  } catch (error) {
    responseError(res, error, 'No se pudo cargar la bitácora de auditoría.');
  }
});

app.post('/api/admin/audit', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  const input = isPlainRecord(req.body) ? req.body : null;
  const actions: AuditAction[] = ['create_session', 'update_session', 'delete_session', 'create_category', 'update_category', 'create_code', 'review_code', 'triangulate', 'export_data', 'system_reset'];
  const entities: AuditEntity[] = ['session', 'category', 'coded_fragment', 'triangulation', 'system'];
  if (
    !input || !actions.includes(input.action as AuditAction) || !entities.includes(input.entityType as AuditEntity) ||
    typeof input.entityId !== 'string' || input.entityId.length > 120 ||
    typeof input.summary !== 'string' || !input.summary.trim() || input.summary.length > 500
  ) {
    res.status(400).json({ error: 'El evento de auditoría no es válido.' });
    return;
  }
  const details = input.details === undefined ? {} : parseJsonObject(input.details);
  if (!details || Buffer.byteLength(JSON.stringify(details), 'utf8') > 8 * 1024) {
    res.status(400).json({ error: 'Los detalles del evento de auditoría no son válidos.' });
    return;
  }
  try {
    const auditEvent = await writeAuditEvent(user, {
      action: input.action as AuditAction,
      entityType: input.entityType as AuditEntity,
      entityId: input.entityId,
      summary: input.summary.trim()
    }, details);
    if (!auditEvent) {
      res.status(503).json({ error: 'No se pudo registrar el evento de auditoría.' });
      return;
    }
    res.status(201).json({ auditEvent });
  } catch (error) {
    responseError(res, error, 'No se pudo registrar el evento de auditoría.');
  }
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function managedUserFromRow(row: Record<string, unknown>): ManagedUser {
  return {
    id: String(row.id),
    name: String(row.display_name),
    email: String(row.email),
    role: row.role === 'admin' ? 'admin' : 'tutor',
    isActive: Boolean(row.is_active),
    createdAt: isoTimestamp(row.created_at)
  };
}

app.get('/api/admin/users', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  try {
    const rows = await sql`
      SELECT id, display_name, email, role, is_active, created_at
      FROM auth_users ORDER BY role, display_name
    `;
    res.json({ users: rows.map((row) => managedUserFromRow(row as Record<string, unknown>)) });
  } catch (error) {
    responseError(res, error, 'No se pudo cargar la lista de usuarios.');
  }
});

// Administración solo crea cuentas de tutor; las cuentas admin se aprovisionan con `npm run users:create`.
app.post('/api/admin/users', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  const input = isPlainRecord(req.body) ? req.body : null;
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input?.password === 'string' ? input.password : '';
  if (name.length < 1 || name.length > 120) {
    res.status(400).json({ error: 'El nombre debe tener entre 1 y 120 caracteres.' });
    return;
  }
  if (!emailPattern.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Escribe un correo válido.' });
    return;
  }
  if ([...password].length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 12 caracteres (máximo 72 bytes).' });
    return;
  }
  try {
    const existing = await sql`SELECT id FROM auth_users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO auth_users (display_name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'tutor')
      RETURNING id, display_name, email, role, is_active, created_at
    `;
    const created = managedUserFromRow(rows[0] as Record<string, unknown>);
    const auditEvent = await writeAuditEvent(user, {
      action: 'create_user', entityType: 'user', entityId: created.id, summary: `Cuenta de tutor creada: ${created.email}`
    }).catch(() => null);
    res.status(201).json({ user: created, auditEvent });
  } catch (error) {
    responseError(res, error, 'No se pudo crear la cuenta.');
  }
});

app.patch('/api/admin/users/:id', writeLimiter, allowSameOrigin, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user || !sql) return;
  if (!requireAdmin(user, res)) return;
  const input = isPlainRecord(req.body) ? req.body : null;
  if (typeof input?.isActive !== 'boolean') {
    res.status(400).json({ error: 'Indica si la cuenta queda activa o inactiva.' });
    return;
  }
  const isActive = input.isActive;
  try {
    const rows = await sql`
      UPDATE auth_users SET is_active = ${isActive}, updated_at = NOW()
      WHERE id::text = ${req.params.id} AND role = 'tutor'
      RETURNING id, display_name, email, role, is_active, created_at
    `;
    if (!rows[0]) {
      res.status(404).json({ error: 'No se encontró la cuenta de tutor.' });
      return;
    }
    const updated = managedUserFromRow(rows[0] as Record<string, unknown>);
    if (!isActive) await sql`UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = ${updated.id} AND revoked_at IS NULL`;
    const auditEvent = await writeAuditEvent(user, {
      action: 'update_user', entityType: 'user', entityId: updated.id,
      summary: `Cuenta de tutor ${isActive ? 'activada' : 'desactivada'}: ${updated.email}`
    }).catch(() => null);
    res.json({ user: updated, auditEvent });
  } catch (error) {
    responseError(res, error, 'No se pudo actualizar la cuenta.');
  }
});

// En Vercel los archivos estáticos se sirven desde public/ y vercel.json reescribe las rutas de la SPA.
if (isProduction && !isVercel) {
  const distDirectory = join(here, 'dist');
  app.use(express.static(distDirectory, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Ruta no encontrada.' });
      return;
    }
    res.sendFile(join(distDirectory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error de servidor.', error instanceof Error ? error.message : 'Error desconocido');
  const status = isPlainRecord(error) && (error.status === 400 || error.status === 413) ? Number(error.status) : 500;
  res.status(status).json({ error: status === 413 ? 'La solicitud supera el tamaño permitido.' : 'Ocurrió un error interno.' });
});

const defaultPort = isProduction ? 3000 : 3001;
const port = Number(process.env.PORT ?? defaultPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
if (!isVercel) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`API SIMECT lista en el puerto ${port}${sql ? '' : ' (Neon sin configurar)'}.`);
  });
}

export default app;
