# DBMS Project Workflow

This document outlines the standard workflow for setting up and managing the Oracle database for our project. Following these steps will ensure every team member has a consistent, local, and offline-first development environment.

This workflow is designed to be cross-platform and tool-agnostic (supporting both SQLcl and SQL Developer).

## 1. Prerequisites

- **Git:** For version control.
- **Docker:** To run the Oracle database.
- **An Oracle SQL Client:** Choose **one** of the following.

  - **Option A: SQLcl (Recommended for CLI users)**
    - **Action:** [Download SQLcl](https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/). Unzip it, and place the **folder** in the project's root directory.

  - **Option B: SQL Developer (Recommended for GUI users)**
    - **Action:** [Download and install SQL Developer](https://www.oracle.com/database/sqldeveloper/technologies/sql-developer-downloads/).

- **Node.js:** For the backend server.

## 2. A Note on Passwords

1.  **The `SYSTEM` Password:** The database administrator password, set when you create the Docker container. Used only to run the master `setup.sql` script.
    - Placeholder: `mysecretpassword`.

2.  **The Application User Password:** The password for the `travel_planner` user that our Node.js app will use.
    - Placeholder: `travel_password`.

## 3. First-Time Setup

### Step 1: Pull the Oracle Docker Image
```bash
docker pull gvenzl/oracle-free
```

### Step 2: Create the Database Container
```bash
# Replace 'mysecretpassword' with your chosen SYSTEM admin password
docker run -d --name oracle-free -p 1521:1521 -e ORACLE_PASSWORD=mysecretpassword -v oracle-db-data:/opt/oracle/oradata gvenzl/oracle-free
```
Wait for the database to be ready by checking the logs (`docker logs -f oracle-free`).

## 4. Daily Development Workflow

### Step 1: Start the Database
```bash
docker start oracle-free
```

### Step 2: Initialize or Reset the Database

To sync your database with the latest changes from Git, run the master setup script. This process **destroys and rebuilds** the schema to guarantee consistency.

#### Method A: Using SQLcl (Command Line)

Run the following command from `sqlcl/bin/`

```bash
# On Windows PowerShell:
cd travel-planner-app/db
../sqlcl/bin/sql SYSTEM/mysecretpassword@localhost:1521/FREEPDB1 @setup.sql

# On Linux or macOS:
cd travel-planner-app/db
../sqlcl/bin/sql SYSTEM/mysecretpassword@localhost:1521/FREEPDB1 @setup.sql
```

#### Method B: Using SQL Developer (GUI)

1.  **Create the Connection (if it doesn't exist):**
    - Open SQL Developer and click the green `+` icon to create a New Database Connection.
    - Enter the following details:
        - **Name:** `local-oracle-free`
        - **Username:** `SYSTEM`
        - **Password:** `mysecretpassword` (the one you chose)
        - **Hostname:** `localhost`
        - **Port:** `1521`
        - **Service name:** `FREEPDB1`
    - Click **Test**, then **Save**, then **Connect**.

2.  **Run the Setup Script:**
    - In the worksheet for your new connection, go to `File > Open...` and select `db/setup.sql` from this project folder.
    - Click the **"Run Script"** button (a page with a green 'play' icon) or press **F5**.
    - The script will run and you will see the output in the "Script Output" tab.

Your database is now clean, fresh, and ready for development, regardless of the tool you used.

## 5. How to Make and Share Database Changes

The process is the same for all team members, regardless of their chosen SQL client.

1.  **Modify the Scripts:** Edit the SQL files in `/db/migrations/` or `/db/seed/`.
2.  **Test Locally:** Run the reset process using your preferred method (SQLcl or SQL Developer).
3.  **Commit and Push:** `git add db/` and commit your changes.
4.  **Inform Teammates:** They can now pull and run the same reset process.

## 6. Project Scripts and Structure

### Master Script: `db/setup.sql`
This script is run by the `SYSTEM` user and works in both SQLcl and SQL Developer.

```sql
-- FILE: db/setup.sql
-- PURPOSE: Resets and rebuilds the entire application schema.
SET FEEDBACK OFF
SET VERIFY OFF

PROMPT 'Starting complete database reset...';

BEGIN
   EXECUTE IMMEDIATE 'DROP USER travel_planner CASCADE';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -1918 THEN RAISE; END IF;
END;
/
PROMPT 'Old schema dropped.';

CREATE USER travel_planner IDENTIFIED BY travel_password;
ALTER USER travel_planner QUOTA UNLIMITED ON users;
GRANT CONNECT, RESOURCE, CREATE VIEW TO travel_planner;
PROMPT 'Application user "travel_planner" created.';

PROMPT 'Running migration scripts...';
@migrations/01_create_tables.sql;

PROMPT 'Running seed scripts...';
@seed/01_add_sample_data.sql;

SET FEEDBACK ON
SET VERIFY ON
PROMPT 'Database setup complete!';
/
```

### Table Creation Script: `db/migrations/01_create_tables.sql`
*(Note: The full content is in the actual file. This is a summary for readability.)*
```sql
-- FILE: db/migrations/01_create_tables.sql
PROMPT 'Creating tables in travel_planner schema...';

CREATE TABLE travel_planner.Customer (
    customerId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- ... columns ...
);

-- ... (and all other CREATE TABLE statements with schema prefixes) ...

PROMPT 'All tables created successfully.';
/
```

### Sample Data Script: `db/seed/01_add_sample_data.sql`
*(Note: The full content is in the actual file. This is a summary for readability.)*
```sql
-- FILE: db/seed/01_add_sample_data.sql
PROMPT 'Inserting sample data into travel_planner schema...';

INSERT INTO travel_planner.Customer (name, email, phone, username, password) VALUES 
('John Doe', 'john@example.com', '+923001234567', 'johndoe', 'password123');

-- ... (and all other INSERT statements with schema prefixes) ...

COMMIT;
PROMPT 'Sample data inserted successfully.';
/
```

## 7. Commands Cheatsheet
- **Create Container:** `docker run -d --name oracle-free -p 1521:1521 -e ORACLE_PASSWORD=mysecretpassword -v oracle-db-data:/opt/oracle/oradata gvenzl/oracle-free`
- **Start/Stop Container:** `docker start oracle-free`, `docker stop oracle-free`
- **Reset DB (CLI):** `.\sql SYSTEM/mysecretpassword@localhost:1521/FREEPDB1 @db/setup.sql`
- **Reset DB (GUI):** Open `db/setup.sql` in a `SYSTEM` user worksheet and press `F5`.
- **Complete Erase:** `docker stop oracle-free && docker rm oracle-free && docker volume rm oracle-db-data`
