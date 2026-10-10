-- SIMECT: ejecutar como propietario de neondb después de crear estos roles
-- desde SQL (no desde Neon Console, CLI ni API):
--   rocas_runtime_app
--   rocas_provisioner_app
--
-- Neon concede membresía en neon_superuser a roles creados desde Console/CLI/API.
-- Este preflight falla sin aplicar cambios si detecta atributos privilegiados,
-- roles inexistentes, roles sin LOGIN o cualquier membresía PostgreSQL.
-- Los roles deben ser exclusivos de esta aplicación. Nunca guardes contraseñas aquí.

BEGIN;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['rocas_runtime_app', 'rocas_provisioner_app'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      RAISE EXCEPTION 'Falta el rol %. Créalo desde SQL con LOGIN antes de continuar.', role_name;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = role_name
        AND (NOT rolcanlogin OR rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls)
    ) THEN
      RAISE EXCEPTION 'El rol % tiene atributos incompatibles con el mínimo privilegio.', role_name;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_auth_members AS membership
      JOIN pg_roles AS member_role ON member_role.oid = membership.member
      WHERE member_role.rolname = role_name
    ) THEN
      RAISE EXCEPTION 'El rol % hereda o puede asumir otro rol; no se aplicaron permisos.', role_name;
    END IF;
  END LOOP;

  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO rocas_runtime_app, rocas_provisioner_app',
    current_database()
  );
END
$$;

REVOKE CREATE ON SCHEMA public FROM rocas_runtime_app, rocas_provisioner_app;
GRANT USAGE ON SCHEMA public TO rocas_runtime_app, rocas_provisioner_app;

-- Los roles son dedicados: limpiar cualquier privilegio de tabla previo y
-- otorgar únicamente los necesarios para cada proceso.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM rocas_runtime_app, rocas_provisioner_app;

-- Proceso web: autenticación, formularios, estado administrativo y bitácora.
-- Administración crea cuentas de tutor y las activa/desactiva desde la web.
GRANT SELECT, INSERT ON auth_users TO rocas_runtime_app;
GRANT UPDATE (is_active, updated_at) ON auth_users TO rocas_runtime_app;
GRANT SELECT, INSERT, UPDATE ON auth_sessions TO rocas_runtime_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON research_sessions TO rocas_runtime_app;
GRANT SELECT, INSERT, UPDATE ON rocas_project_state TO rocas_runtime_app;
GRANT SELECT, INSERT ON researcher_audit_log TO rocas_runtime_app;

-- Herramienta local de altas: solo consulta e inserción de cuentas.
GRANT SELECT, INSERT ON auth_users TO rocas_provisioner_app;

COMMIT;
