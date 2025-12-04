-- FILE: db/setup.sql
-- PURPOSE: Resets and rebuilds the entire application schema.
-- RUN AS: SYSTEM user (works in both SQLcl and SQL Developer)

PROMPT 'Starting complete database reset...';
SET FEEDBACK OFF
SET VERIFY OFF

-- Step 1: Drop the old application user. This instantly deletes all of its tables,
-- views, and other objects in a single, clean command.
BEGIN
   EXECUTE IMMEDIATE 'DROP USER travel_planner CASCADE';
EXCEPTION
   WHEN OTHERS THEN
      -- Ignores the error "ORA-01918: user 'TRAVEL_PLANNER' does not exist"
      IF SQLCODE != -1918 THEN
         RAISE;
      END IF;
END;
/

PROMPT 'Old schema dropped.';

-- Step 2: Create the application user/schema. Our Node.js app will connect as this user.
-- Replace 'travel_password' with your chosen application password.
CREATE USER travel_planner IDENTIFIED BY travel_password;

-- Step 3: Grant necessary permissions to the new user.
ALTER USER travel_planner QUOTA UNLIMITED ON users;
-- RESOURCE includes a set of privileges, and we add CREATE VIEW, PROCEDURE, TRIGGER separately.
GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER TO travel_planner;

PROMPT 'Application user "travel_planner" created and granted permissions.';

-- Step 4: Run all other scripts to build the schema and add data.
-- Since all objects are schema-prefixed (e.g., travel_planner.Customer),
-- these scripts can be run by the SYSTEM user who is executing this master script.

PROMPT '===========================================';
PROMPT 'Running migration scripts...';
PROMPT '===========================================';

PROMPT '';
PROMPT '[1/4] Creating tables...';
@migrations/01_create_tables.sql;

PROMPT '';
PROMPT '[2/4] Creating views...';
@migrations/02_views.sql;

PROMPT '';
PROMPT '[3/4] Creating stored procedures...';
@migrations/03_procedures.sql;

PROMPT '';
PROMPT '[4/4] Creating triggers...';
@migrations/04_triggers.sql;

PROMPT '';
PROMPT '===========================================';
PROMPT 'Running seed scripts...';
PROMPT '===========================================';

PROMPT '';
PROMPT 'Inserting sample data...';
@seed/01_add_sample_data.sql;

SET FEEDBACK ON
SET VERIFY ON

PROMPT '';
PROMPT '===========================================';
PROMPT 'Database setup complete!';
PROMPT '===========================================';
PROMPT '';
PROMPT 'Summary of created objects:';
PROMPT '  - 15 Tables (including Audit_Log)';
PROMPT '  - 5 Views';
PROMPT '  - 5 Stored Procedures';
PROMPT '  - 5 Triggers';
PROMPT '';
PROMPT 'You can now connect as travel_planner user.';
/
