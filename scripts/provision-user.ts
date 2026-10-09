import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

type Role = 'tutor' | 'admin';

function askHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Este comando requiere una terminal interactiva para ocultar la contraseña.'));
  }

  return new Promise((resolve, reject) => {
    const chars: string[] = [];
    stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (value?: string, error?: Error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value ?? '');
    };

    const onData = (chunk: string | Buffer) => {
      for (const char of String(chunk)) {
        if (char === '\u0003') {
          finish(undefined, new Error('Operación cancelada.'));
          return;
        }
        if (char === '\r' || char === '\n') {
          finish(chars.join(''));
          return;
        }
        if (char === '\u0008' || char === '\u007f') {
          if (chars.length > 0) {
            chars.pop();
            stdout.write('\b \b');
          }
          continue;
        }
        if (char.codePointAt(0)! >= 32) {
          chars.push(char);
          stdout.write('*');
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_PROVISION_URL?.trim();
  if (!databaseUrl) throw new Error('Falta DATABASE_PROVISION_URL para el rol de provisión de Neon.');

  const prompts = createInterface({ input: stdin, output: stdout });
  const displayName = (await prompts.question('Nombre para mostrar: ')).trim();
  const email = (await prompts.question('Correo: ')).trim().toLowerCase();
  const roleAnswer = (await prompts.question('Rol (tutor/admin): ')).trim().toLowerCase();
  prompts.close();

  if (displayName.length < 1 || displayName.length > 120) {
    throw new Error('El nombre debe tener entre 1 y 120 caracteres.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Escribe un correo válido.');
  }
  if (roleAnswer !== 'tutor' && roleAnswer !== 'admin') {
    throw new Error('El rol solo puede ser tutor o admin.');
  }
  const role: Role = roleAnswer;

  const password = await askHidden('Contraseña nueva (mínimo 12 caracteres): ');
  const confirmation = await askHidden('Repite la contraseña: ');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  if ([...password].length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('La contraseña supera el máximo seguro de 72 bytes para bcrypt.');
  }

  const sql = neon(databaseUrl);
  const existing = await sql`SELECT id FROM auth_users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) throw new Error('Ya existe una cuenta con ese correo.');

  const passwordHash = await bcrypt.hash(password, 12);
  const inserted = await sql`
    INSERT INTO auth_users (display_name, email, password_hash, role)
    VALUES (${displayName}, ${email}, ${passwordHash}, ${role})
    RETURNING id, display_name, email, role
  `;
  const user = inserted[0] as { id: string; display_name: string; email: string; role: Role };
  console.log(`Cuenta creada: ${user.email} · ${user.role} · id ${user.id}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.';
  console.error(`No se pudo crear la cuenta: ${message}`);
  process.exitCode = 1;
});
