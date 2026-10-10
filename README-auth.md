# Acceso y datos de SIMECT con Neon

El nombre visible del producto es **SIMECT**. Se mantienen los identificadores históricos `rocas_*` del esquema y los roles para conservar compatibilidad; este cambio de marca no ejecuta ni requiere cambios en Neon.

## Qué hace esta implementación

- La página inicial es un inicio de sesión para **Tutor** y **Administración**. No hay registro público ni cuentas o contraseñas de prueba para la autenticación real.
- Cuando la autenticación real no está configurada o el servicio de sesión no responde, aparecen dos botones de **entrada rápida de revisión**, también en producción. Abren perfiles locales de tutor o administración, cargan datos de ejemplo para administración y mantienen cualquier cambio solo en memoria; no consultan ni escriben en Neon. Si el servidor confirma que la autenticación real sí está configurada, los botones no aparecen. Los cambios de revisión se pierden al recargar.
- El servidor valida correo, contraseña y rol; usa bcrypt (factor 12), limita intentos, crea una sesión opaca de ocho horas y solo guarda el hash SHA-256 del token en Neon. La cookie es `HttpOnly`, `SameSite=Strict` y, en producción, `Secure`.
- Un tutor puede crear formularios y consultar solo los que creó su cuenta. La administración puede consultar, editar y retirar formularios de cualquier tutor.
- La administración, los fragmentos codificados y las matrices de triangulación se cargan desde Neon y solo se modifican mediante rutas que vuelven a comprobar el rol en el servidor. El estado administrativo usa control de versión para no pisar silenciosamente cambios concurrentes.
- El servidor atribuye y fecha los eventos de la bitácora. La aplicación no ofrece rutas para modificarla o borrarla; el retiro de una sesión y su evento se ejecutan atómicamente. Los eventos de otras operaciones dependen de escrituras separadas y pueden fallar sin revertir el cambio principal. La bitácora no es una prueba criptográfica contra quien tenga privilegios de propietario de la base.
- Los formularios no se guardan en `localStorage`. El navegador mantiene el borrador solo en memoria hasta que el servidor confirma el guardado.

## Preparar Neon

1. En el proyecto de Neon que hayas elegido, ejecuta [`db/schema.sql`](db/schema.sql). El archivo crea tablas idempotentes y no agrega usuarios ni datos de muestra.
2. **Crea los roles de aplicación desde el Neon SQL Editor o un cliente SQL, no desde la sección Roles de Neon Console, CLI ni API.** Neon concede membresía en `neon_superuser` a los roles creados por esas interfaces. Para esta aplicación se usan los nombres `rocas_runtime_app` y `rocas_provisioner_app`, con contraseñas fuertes y distintas. No guardes las contraseñas en el repositorio, consultas compartidas ni correo. La sintaxis documentada por Neon es `CREATE ROLE nombre WITH LOGIN PASSWORD 'contraseña-fuerte';`; reemplaza los valores con credenciales propias antes de ejecutar.
3. Como propietario de la base, ejecuta [`db/least-privilege.sql`](db/least-privilege.sql). El script comprueba que ambos roles existan, tengan `LOGIN`, no tengan atributos elevados y no sean miembros de ningún otro rol. Si alguna condición no se cumple, detiene la transacción. Revoca los permisos de tabla previos de estos roles dedicados y otorga únicamente los accesos necesarios: el proceso web no puede actualizar ni borrar eventos de auditoría; el proceso de altas solo puede consultar e insertar cuentas.
4. **No uses para la aplicación los roles `rocas_runtime` y `rocas_provisioner` creados anteriormente desde la consola.** La comprobación observada en `main` indicó que ambos heredan `neon_superuser` y mantienen privilegios efectivos amplios. Déjalos sin uso y coordina con el propietario de la base su desactivación o eliminación segura cuando no tengan dependencias; no intentes ocultar este riesgo solo con cambios en la interfaz.
5. Guarda la cadena de conexión de `rocas_runtime_app` como `DATABASE_URL` en el entorno **privado del servidor**. Para crear cuentas, usa `rocas_provisioner_app` solo localmente como `DATABASE_PROVISION_URL`; nunca configures esta última en el servicio web.
6. Configura `APP_ORIGIN` con el origen exacto de la página pública. No uses variables `VITE_*` para secretos. En producción define `NODE_ENV=production`; solo declara `TRUST_PROXY` si conoces el número exacto de proxies confiables.
7. Ejecuta el esquema y permisos antes de aprovisionar cuentas. Desde una terminal privada, crea una cuenta por persona:

   ```sh
   npm run users:create
   ```

   El comando solicita el nombre, correo, rol (`tutor` o `admin`) y contraseña dos veces, sin mostrarla mientras se escribe. La contraseña requiere al menos 12 caracteres y admite como máximo 72 bytes por el algoritmo bcrypt. Crea por lo menos una cuenta `admin`; no existe una contraseña predeterminada.

8. Para desarrollo con cuentas reales, coloca las variables correspondientes en un `.env` local excluido de Git. `npm run dev` inicia Vite en el puerto 3000 y la API Express en el 3001. Si no configuras Neon, puedes usar las entradas rápidas locales para revisar la interfaz. Para producción, `npm run build` genera el frontend y `npm start` sirve la aplicación y la API desde Express; las entradas rápidas solo se muestran si la autenticación real no está configurada o el servicio de sesión no responde.

## Protección y límites de los datos

Escribe únicamente **seudónimos** en los campos destinados a participantes; no existe un campo seguro para nombres reales ni cifrado de nombres en esta aplicación. La seudonimización no elimina por sí sola el riesgo: una transcripción también puede identificar a una persona por su contenido. La casilla de consentimiento obliga a confirmar el paso en el formulario, pero no reemplaza el proceso ético ni constituye una verificación independiente del consentimiento.

La lista de formularios devuelve hasta 1.000 registros y la pantalla de auditoría muestra los 500 eventos más recientes. Si se alcanza alguno de esos límites, la interfaz lo indica; antes de superar esos volúmenes hay que añadir paginación. La exportación JSON contiene respuestas, seudónimos, categorías y eventos disponibles: trátala como información sensible y almacénala con acceso restringido.

La importación y el restablecimiento afectan solo categorías, fragmentos y triangulaciones. Por diseño, no importan, reemplazan ni borran formularios ni eventos de auditoría. Los cambios administrativos se sincronizan automáticamente con control de versión; ante un conflicto, conserva/exporta el cambio local antes de recargar.

## Comprobaciones

Antes de usar datos reales, verifica en un entorno controlado que: (1) un tutor no puede consultar ni modificar registros de otro tutor; (2) un tutor recibe `403` al intentar acciones administrativas; (3) las cuentas y contraseñas se aprovisionan por separado; (4) `DATABASE_URL` usa `rocas_runtime_app` y `DATABASE_PROVISION_URL` usa `rocas_provisioner_app`; (5) ninguno de esos roles hereda `neon_superuser` ni otros roles; y (6) las copias y exportaciones tienen acceso restringido. No conectes datos identificables de menores a una instalación sin verificar primero los requisitos éticos, organizativos y de tratamiento de datos aplicables.
