-- Migration 008: Seed Thresholds and their Approvers
-- Insert all thresholds from DOA_DATA across 6 types:
--   high_risk, non_binding, commercial, direct_sales, direct_sales_markup, epf

-- =============================================================================
-- HIGH RISK THRESHOLD (1 threshold)
-- =============================================================================

INSERT INTO thresholds (threshold_id, type, name, code, condition_text, notes, sort_order)
VALUES (
    'high-risk',
    'high_risk',
    'High-Risk Market',
    '4.1.1',
    'Any value in High-Risk Market',
    'REGARDLESS OF CONTRACT VALUE - All commitments in High-Risk Markets require BOD approval. High Risk Market determined by GRC Risk Function. Review committee: CEO, CFO, COO, Commercial & Marketing, General Counsel. E1*: Either role as applicable to tender scope.',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4*', 'Endorse', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 'Endorse', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 'Endorse', 4),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3*', 'Endorse', 5),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'E2*', 'Endorse', 6),
((SELECT id FROM thresholds WHERE threshold_id = 'high-risk'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 'Endorse', 7);

-- =============================================================================
-- NON-BINDING THRESHOLDS (3 thresholds)
-- =============================================================================

-- nb-over-50m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, notes, sort_order)
VALUES (
    'nb-over-50m',
    'non_binding',
    'Non-binding RFQ/RFP/Quote > SAR 50M',
    '4.2.1.1',
    50000001,
    'For client budgetary purposes - applies to non-contracted work (new potential contracts). Country/market designation does not affect approval requirements for budgetary proposals.',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'nb-over-50m'), (SELECT id FROM roles WHERE name = 'COO'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-over-50m'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-over-50m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-over-50m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- nb-18m-50m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'nb-18m-50m',
    'non_binding',
    'SAR 18.75M < Non-binding RFQ/RFP/Quote <= SAR 50M',
    '4.2.1.2',
    18750001,
    50000000,
    'For client budgetary purposes - applies to non-contracted work (new potential contracts). Country/market designation does not affect approval requirements for budgetary proposals.',
    2
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'nb-18m-50m'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-18m-50m'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-18m-50m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-18m-50m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- nb-under-18m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'nb-under-18m',
    'non_binding',
    'Non-binding RFQ/RFP/Quote <= SAR 18.75M',
    '4.2.1.3',
    0,
    18750000,
    'For client budgetary purposes - applies to non-contracted work (new potential contracts). Country/market designation does not affect approval requirements for budgetary proposals.',
    3
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'nb-under-18m'), (SELECT id FROM roles WHERE name = 'PSL/EPF Director'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-under-18m'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'nb-under-18m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 3);

-- =============================================================================
-- COMMERCIAL THRESHOLDS (6 thresholds)
-- =============================================================================

-- over-200m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, notes, sort_order)
VALUES (
    'over-200m',
    'commercial',
    'Contract > SAR 200 Million',
    '4.2.2.1',
    200000000,
    'Regardless of Capex value - BOD approval required for all contracts exceeding SAR 200 Million. E1*: Either COO or EPF as applicable to tender scope.',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 'Endorse', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 'Review', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3', 'Endorse', 4),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4', 'Endorse', 5),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 'Endorse', 6),
((SELECT id FROM thresholds WHERE threshold_id = 'over-200m'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 'Endorse', 7);

-- 50m-200m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    '50m-200m',
    'commercial',
    'SAR 50M < TCV <= 200M',
    '4.2.2.2',
    50000000,
    200000000,
    'Regardless of Capex value. E1*: Either COO or EPF as applicable to tender scope.',
    2
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'ExCom'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 'Endorse', 2),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 'Review', 3),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3', 'Endorse', 4),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4', 'Endorse', 5),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 'Endorse', 6),
((SELECT id FROM thresholds WHERE threshold_id = '50m-200m'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 'Endorse', 7);

-- capex-over-10m
INSERT INTO thresholds (threshold_id, type, name, code, min_capex, notes, sort_order)
VALUES (
    'capex-over-10m',
    'commercial',
    'Any Contract with Capex > SAR 10M',
    '4.2.2.3',
    10000001,
    'Applies to contracts <= SAR 200M with Capex exceeding SAR 10 Million. E1*: Either COO or EPF as applicable to tender scope.',
    3
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'ExCom'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 'Endorse', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'CFO'), 'E2', 'Endorse', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'CEO'), 'E3', 'Endorse', 4),
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 'Endorse', 5),
((SELECT id FROM thresholds WHERE threshold_id = 'capex-over-10m'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 'Endorse', 6);

-- 30m-50m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    '30m-50m',
    'commercial',
    'SAR 30M < TCV <= 50M (or Capex 5-10M)',
    '4.2.3.1.1',
    30000000,
    50000000,
    'SAR 30M < TCV <= SAR 50M regardless of Capex; or for all contracts with SAR 5M < Capex <= SAR 10M',
    4
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = '30m-50m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = '30m-50m'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = '30m-50m'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = '30m-50m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X4', 'Approve', 4);

-- 5m-30m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    '5m-30m',
    'commercial',
    'SAR 5M < TCV <= 30M',
    '4.2.3.1.2',
    5000000,
    30000000,
    'With Capex up to SAR 5 Million; or TCV < SAR 5M with Capex up to SAR 5M',
    5
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = '5m-30m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = '5m-30m'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = '5m-30m'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = '5m-30m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- under-5m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'under-5m',
    'commercial',
    'TCV <= SAR 5 Million',
    '4.2.3.1.3',
    0,
    5000000,
    'With/without Capex up to 10% TCV (fully loaded Operating Profit with net income > 10%)',
    6
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'under-5m'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'under-5m'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'under-5m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'under-5m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- =============================================================================
-- DIRECT SALES THRESHOLDS (5 thresholds)
-- =============================================================================

-- ds-low-margin
INSERT INTO thresholds (threshold_id, type, name, code, max_gross_margin, notes, sort_order)
VALUES (
    'ds-low-margin',
    'direct_sales',
    'Low Margin (GM <40%)',
    '4.2.3.2.1',
    40.00,
    'All contracts with Gross Margin <40% regardless of Contract Value',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-low-margin'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-low-margin'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-low-margin'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-low-margin'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- ds-30m-50m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'ds-30m-50m',
    'direct_sales',
    'SAR 30M < TCV <= 50M (GM >=40%)',
    '4.2.3.2.2',
    30000000,
    50000000,
    'Direct Sales with Gross Margin >=40%',
    2
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-30m-50m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-30m-50m'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-30m-50m'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-30m-50m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- ds-18m-30m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'ds-18m-30m',
    'direct_sales',
    'SAR 18.75M < TCV <= 30M (GM >=40%)',
    '4.2.3.2.3',
    18750000,
    30000000,
    'Direct Sales with Gross Margin >=40%',
    3
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-18m-30m'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-18m-30m'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-18m-30m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-18m-30m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- ds-1m-18m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'ds-1m-18m',
    'direct_sales',
    'SAR 1.875M < TCV <= 18.75M (GM >=40%)',
    '4.2.3.2.4',
    1875000,
    18750000,
    'Direct Sales with Gross Margin >=40%',
    4
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-1m-18m'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X2', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-1m-18m'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X1', 'Approve', 2);

-- ds-under-1m
INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value, notes, sort_order)
VALUES (
    'ds-under-1m',
    'direct_sales',
    'TCV <= SAR 1.875M (GM >=40%)',
    '4.2.3.2.5',
    0,
    1875000,
    'Direct Sales with Gross Margin >=40%',
    5
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-under-1m'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-under-1m'), (SELECT id FROM roles WHERE name = 'PSL/EPF Director'), 'X2', 'Approve', 2);

-- =============================================================================
-- DIRECT SALES MARKUP THRESHOLDS (2 thresholds)
-- =============================================================================

-- ds-markup-low
INSERT INTO thresholds (threshold_id, type, name, code, max_markup, notes, sort_order)
VALUES (
    'ds-markup-low',
    'direct_sales_markup',
    'Product Total Cost Markup < 25%',
    '4.2.3.2.4.1',
    25.00,
    'Direct Service Lines Sales (e.g., Chemicals) with Product Total Cost Markup below 25%',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-low'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-low'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-low'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-low'), (SELECT id FROM roles WHERE name = 'COO'), 'X4', 'Approve', 4),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-low'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 5);

-- ds-markup-high
INSERT INTO thresholds (threshold_id, type, name, code, min_markup, notes, sort_order)
VALUES (
    'ds-markup-high',
    'direct_sales_markup',
    'Product Total Cost Markup >= 25%',
    '4.2.3.2.4.2',
    25.00,
    'Direct Service Lines Sales (e.g., Chemicals) with Product Total Cost Markup 25% or higher',
    2
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-high'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-high'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-high'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'ds-markup-high'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 'Approve', 4);

-- =============================================================================
-- EPF THRESHOLDS (1 threshold)
-- =============================================================================

-- epf-50m
INSERT INTO thresholds (threshold_id, type, name, code, notes, sort_order)
VALUES (
    'epf-50m',
    'epf',
    'EPF: TCV up to SAR 50M (Capex up to 10M)',
    '4.2.3.3.1',
    'EPF Customer Commitments with TCV up to SAR 50M and Capex up to SAR 10M',
    1
);

INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order) VALUES
((SELECT id FROM thresholds WHERE threshold_id = 'epf-50m'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 'Approve', 1),
((SELECT id FROM thresholds WHERE threshold_id = 'epf-50m'), (SELECT id FROM roles WHERE name = 'EPF'), 'X2', 'Approve', 2),
((SELECT id FROM thresholds WHERE threshold_id = 'epf-50m'), (SELECT id FROM roles WHERE name = 'CFO'), 'X3', 'Approve', 3),
((SELECT id FROM thresholds WHERE threshold_id = 'epf-50m'), (SELECT id FROM roles WHERE name = 'CEO'), 'X4', 'Approve', 4);
