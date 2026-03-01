-- Migration 001: Initial Schema
-- Creates all 14 tables for the TAQA DOA Reader & Calculator

-- PostgreSQL 13+ provides gen_random_uuid() natively (no extension needed)

-- 1. Categories (14 organizational domains)
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Approval Roles
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Countries
CREATE TABLE countries (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    risk_level  VARCHAR(20) NOT NULL DEFAULT 'high_risk'
                CHECK (risk_level IN ('safe', 'special', 'high_risk')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DOA Items (calculator items)
CREATE TABLE doa_items (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    applies_to      VARCHAR(100),
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    business_owner  VARCHAR(200),
    delegable       VARCHAR(10),
    interpretation  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DOA Item Approvers
CREATE TABLE doa_item_approvers (
    id          SERIAL PRIMARY KEY,
    doa_item_id INTEGER NOT NULL REFERENCES doa_items(id) ON DELETE CASCADE,
    role_id     INTEGER NOT NULL REFERENCES roles(id),
    action      VARCHAR(10) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    UNIQUE(doa_item_id, role_id, action)
);

-- 6. Threshold Types enum
CREATE TYPE threshold_type AS ENUM (
    'high_risk',
    'non_binding',
    'commercial',
    'direct_sales',
    'direct_sales_markup',
    'epf'
);

-- 7. Thresholds
CREATE TABLE thresholds (
    id              SERIAL PRIMARY KEY,
    threshold_id    VARCHAR(50) NOT NULL UNIQUE,
    type            threshold_type NOT NULL,
    name            VARCHAR(300) NOT NULL,
    code            VARCHAR(30) NOT NULL,
    min_value       BIGINT,
    max_value       BIGINT,
    min_capex       BIGINT,
    max_capex       BIGINT,
    min_markup      NUMERIC(5,2),
    max_markup      NUMERIC(5,2),
    max_gross_margin NUMERIC(5,2),
    condition_text  TEXT,
    notes           TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Threshold Approvers
CREATE TABLE threshold_approvers (
    id              SERIAL PRIMARY KEY,
    threshold_id    INTEGER NOT NULL REFERENCES thresholds(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    action          VARCHAR(10) NOT NULL,
    label           VARCHAR(50),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(threshold_id, role_id, action)
);

-- 9. Browse DOA Data
CREATE TABLE browse_items (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL,
    parent_code     VARCHAR(30),
    title           TEXT NOT NULL,
    description     VARCHAR(500),
    comments        TEXT,
    function_name   VARCHAR(200),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_browse_items_code ON browse_items(code);
CREATE INDEX idx_browse_items_parent ON browse_items(parent_code);
CREATE INDEX idx_browse_items_function ON browse_items(function_name);

-- 10. Browse Item Approval Chain
CREATE TABLE browse_item_approvers (
    id              SERIAL PRIMARY KEY,
    browse_item_id  INTEGER NOT NULL REFERENCES browse_items(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    action          VARCHAR(10) NOT NULL,
    kind            CHAR(1) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

-- 11. Application Settings
CREATE TABLE app_settings (
    id              SERIAL PRIMARY KEY,
    key             VARCHAR(100) NOT NULL UNIQUE,
    value           JSONB NOT NULL,
    updated_by      UUID,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azure_oid       VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(300) NOT NULL,
    display_name    VARCHAR(300) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin', 'viewer')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Trail
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       VARCHAR(100),
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- 14. Glossary
CREATE TABLE glossary (
    id              SERIAL PRIMARY KEY,
    code            CHAR(1) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doa_items_updated_at BEFORE UPDATE ON doa_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_thresholds_updated_at BEFORE UPDATE ON thresholds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_browse_items_updated_at BEFORE UPDATE ON browse_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
