-- Permisos para editar y eliminar cuentas desde la sección Usuarios.
-- Ejecútalo UNA VEZ en el editor SQL de Neon con el rol propietario de la base (no con rocas_runtime_app).
-- Sin esto, "Desactivar/Reactivar" sigue funcionando, pero "Editar" y "Eliminar" avisan que falta aplicarlo.

GRANT UPDATE (display_name, email, role, password_hash, is_active, updated_at) ON auth_users TO rocas_runtime_app;
GRANT DELETE ON auth_users TO rocas_runtime_app;

-- Nota: una cuenta con formularios, cambios del proyecto o registros de auditoría NO se puede eliminar
-- (las claves foráneas lo impiden a propósito para no perder datos de investigación). En ese caso
-- se debe desactivar.
