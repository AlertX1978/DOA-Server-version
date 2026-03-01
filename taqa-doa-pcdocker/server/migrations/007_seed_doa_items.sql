-- Migration 007: Seed DOA Items and their Approvers
-- Insert all 37 DOA items from DOA_DATA.items with approver junction records

-- 1. Item 1.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('1.1.1', 'Establish By-Laws/ Articles of Association and JV Agreements', 'Wholly Owned', 1, 'Corporate Development');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '1.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '1.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '1.1.1'), (SELECT id FROM roles WHERE name = 'Strategy & Corp Dev'), 'R1', 3),
((SELECT id FROM doa_items WHERE code = '1.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 4),
((SELECT id FROM doa_items WHERE code = '1.1.1'), (SELECT id FROM roles WHERE name = 'VP GRC'), 'R1', 5);

-- 2. Item 1.2.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('1.2.1.1', 'Amendment of TAQA''s By-laws', 'TAQA', 1, 'Legal');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '1.2.1.1'), (SELECT id FROM roles WHERE name = 'General Assembly'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '1.2.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'E2', 2),
((SELECT id FROM doa_items WHERE code = '1.2.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 3),
((SELECT id FROM doa_items WHERE code = '1.2.1.1'), (SELECT id FROM roles WHERE name = 'Strategy & Corp Dev'), 'R1', 4),
((SELECT id FROM doa_items WHERE code = '1.2.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 5);

-- 3. Item 1.2.1.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, interpretation)
VALUES ('1.2.1.1.1', 'Capital increase/decrease, change of Head Office and Objectives', 'Wholly Owned', 1, 'Corporate Governance', 'X2*: Board approval required only for changing company objective if it is change in core business');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '1.2.1.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X2*', 1),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.1'), (SELECT id FROM roles WHERE name = 'ExCom'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 3),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R2', 4),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R1', 5);

-- 4. Item 1.2.1.1.2
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('1.2.1.1.2', 'Other By-law amendments', 'Wholly Owned', 1, 'Corporate Governance', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '1.2.1.1.2'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.2'), (SELECT id FROM roles WHERE name = 'Strategy & Corp Dev'), 'R1', 2),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.2'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 3),
((SELECT id FROM doa_items WHERE code = '1.2.1.1.2'), (SELECT id FROM roles WHERE name = 'VP GRC'), 'R1', 4);

-- 5. Item 1.3.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, interpretation)
VALUES ('1.3.1.1', 'Incorporation of Branch Offices of TAQA', 'TAQA', 1, 'Legal', 'In accordance with TAQA Bylaw - Article 5');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '1.3.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '1.3.1.1'), (SELECT id FROM roles WHERE name = 'ExCom'), 'E2', 2),
((SELECT id FROM doa_items WHERE code = '1.3.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 3),
((SELECT id FROM doa_items WHERE code = '1.3.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R2', 4),
((SELECT id FROM doa_items WHERE code = '1.3.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 5);

-- 6. Item 3.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('3.1.1', 'Approve TAQA Strategy', 'TAQA', 3, 'Strategy');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '3.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '3.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '3.1.1'), (SELECT id FROM roles WHERE name = 'Strategy & Corp Dev'), 'R1', 3);

-- 7. Item 3.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('3.2.1', 'Approve Annual Business Plan & Budget', 'TAQA', 3, 'Finance');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '3.2.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '3.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '3.2.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R1', 3);

-- 8. Item 4.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, interpretation)
VALUES ('4.1.1', 'Customer Commitments in High-Risk Market', '', 4, 'Commercial and Marketing', 'High Risk Market determined by GRC Risk Function. Review committee: CEO, CFO, COO, Commercial & Marketing, General Counsel');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4*', 2),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 3),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 4),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3*', 5),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'E2*', 6),
((SELECT id FROM doa_items WHERE code = '4.1.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 7);

-- 9. Item 4.2.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.1.1', 'Non-binding RFQs/RFPs/Quotes > SAR 50 Million', '', 4, 'Commercial and Marketing', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.1.1'), (SELECT id FROM roles WHERE name = 'COO'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '4.2.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.1.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 4);

-- 10. Item 4.2.1.2
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.1.2', 'SAR 18.75M < Non-binding RFQs/RFPs/Quotes <= SAR 50 Million', '', 4, 'Commercial and Marketing', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.1.2'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.1.2'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '4.2.1.2'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.1.2'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 4);

-- 11. Item 4.2.1.3
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.1.3', 'Non-binding RFQs/RFPs/Quotes <= SAR 18.75 Million', '', 4, 'Commercial and Marketing', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.1.3'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.1.3'), (SELECT id FROM roles WHERE name = 'PSL/EPF Director'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '4.2.1.3'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X2', 3);

-- 12. Item 4.2.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.2.1', 'Total Contract Value > SAR 200 Million (regardless of Capex)', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4', 2),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 3),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 4),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3', 5),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 6),
((SELECT id FROM doa_items WHERE code = '4.2.2.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 7);

-- 13. Item 4.2.2.2
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.2.2', 'SAR 50M < Total Contract Value <= SAR 200M (regardless of Capex)', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'ExCom'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'CEO'), 'E4', 2),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 3),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 4),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'CFO'), 'E3', 5),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R2', 6),
((SELECT id FROM doa_items WHERE code = '4.2.2.2'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 7);

-- 14. Item 4.2.2.3
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.2.3', 'Any Contract with Capex > SAR 10 Million', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'ExCom'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'CEO'), 'E3', 2),
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'COO'), 'E1*', 3),
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'EPF'), 'E1*', 4),
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'CFO'), 'E2', 5),
((SELECT id FROM doa_items WHERE code = '4.2.2.3'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'E1', 6);

-- 15. Item 4.2.3.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.1.1', 'SAR 30M < TCV <= SAR 50M regardless of Capex; or Capex SAR 5-10M', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X4', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.1'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 4);

-- 16. Item 4.2.3.1.2
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.1.2', 'SAR 5M < TCV <= SAR 30M with Capex up to 5M; or TCV < 5M with Capex up to 5M', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.1.2'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.2'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.2'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.2'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 4);

-- 17. Item 4.2.3.1.3
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.1.3', 'TCV <= SAR 5M with/without Capex up to 10% TCV (fully loaded Operating Profit with net income > 10%)', '', 4, 'Commercial and Marketing');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.1.3'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.3'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.3'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.1.3'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 4);

-- 18. Item 4.2.3.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.3.2.1', 'Direct Sales: All Contracts with Gross Margin <40% regardless of Contract Value', '', 4, 'COO', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.1'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 4);

-- 19. Item 4.2.3.2.2
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.3.2.2', 'Direct Sales: SAR 30M < TCV <= 50M (GM >=40%)', '', 4, 'COO', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.2.2'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.2'), (SELECT id FROM roles WHERE name = 'COO'), 'X3', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.2'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.2'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 4);

-- 20. Item 4.2.3.2.3
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable)
VALUES ('4.2.3.2.3', 'Direct Sales: SAR 18.75M < TCV <= SAR 30M (GM >=40%)', '', 4, 'COO', 'Yes');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.2.3'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.3'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.3'), (SELECT id FROM roles WHERE name = 'FP&A Director'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.3'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X3', 4);

-- 21. Item 4.2.3.2.4
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.2.4', 'Direct Sales: SAR 1.875M < TCV <= SAR 18.75M (GM >=40%)', '', 4, 'COO');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.2.4'), (SELECT id FROM roles WHERE name = 'Head of PSL'), 'X2', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.4'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X1', 2);

-- 22. Item 4.2.3.2.5
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.2.5', 'Direct Sales: TCV <= SAR 1.875M (GM >=40%)', '', 4, 'COO');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.2.5'), (SELECT id FROM roles WHERE name = 'PSL/CoE/EPF Finance Controller'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.2.5'), (SELECT id FROM roles WHERE name = 'PSL/EPF Director'), 'X2', 2);

-- 23. Item 4.2.3.3.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('4.2.3.3.1', 'EPF: TCV up to SAR 50M with Capex up to 10M', '', 4, 'EPF Head');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '4.2.3.3.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X4', 1),
((SELECT id FROM doa_items WHERE code = '4.2.3.3.1'), (SELECT id FROM roles WHERE name = 'EPF'), 'X2', 2),
((SELECT id FROM doa_items WHERE code = '4.2.3.3.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X3', 3),
((SELECT id FROM doa_items WHERE code = '4.2.3.3.1'), (SELECT id FROM roles WHERE name = 'Marketing & Commercial'), 'X1', 4);

-- 24. Item 5.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('5.1.1', 'Approve Organization Structure Changes', 'TAQA', 5, 'HR');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '5.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '5.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '5.1.1'), (SELECT id FROM roles WHERE name = 'VP HR'), 'R1', 3);

-- 25. Item 5.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('5.2.1', 'Approve Compensation & Benefits Policy', 'TAQA', 5, 'HR');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '5.2.1'), (SELECT id FROM roles WHERE name = 'NRC'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '5.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '5.2.1'), (SELECT id FROM roles WHERE name = 'VP HR'), 'R1', 3);

-- 26. Item 6.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('6.1.1', 'Open/Close Bank Accounts', '', 6, 'Treasury');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '6.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '6.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '6.1.1'), (SELECT id FROM roles WHERE name = 'Treasury Director'), 'R1', 3);

-- 27. Item 6.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('6.2.1', 'Approve Borrowing/Financing > SAR 100M', '', 6, 'Treasury');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '6.2.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '6.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '6.2.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R1', 3),
((SELECT id FROM doa_items WHERE code = '6.2.1'), (SELECT id FROM roles WHERE name = 'Treasury Director'), 'R2', 4);

-- 28. Item 7.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('7.1.1', 'Approve Annual Financial Statements', 'TAQA', 7, 'Finance');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '7.1.1'), (SELECT id FROM roles WHERE name = 'Audit Committee'), 'E1', 1),
((SELECT id FROM doa_items WHERE code = '7.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 2),
((SELECT id FROM doa_items WHERE code = '7.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E2', 3),
((SELECT id FROM doa_items WHERE code = '7.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R1', 4);

-- 29. Item 7.2.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('7.2.1', 'Write-off Bad Debts > SAR 1M', '', 7, 'Finance');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '7.2.1'), (SELECT id FROM roles WHERE name = 'Audit Committee'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '7.2.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '7.2.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R1', 3);

-- 30. Item 8.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('8.1.1', 'Approve Tax Strategy', 'TAQA', 8, 'Tax');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '8.1.1'), (SELECT id FROM roles WHERE name = 'Audit Committee'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '8.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '8.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'R1', 3),
((SELECT id FROM doa_items WHERE code = '8.1.1'), (SELECT id FROM roles WHERE name = 'Tax Director'), 'R2', 4);

-- 31. Item 9.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('9.1.1', 'P.O/Contract > SAR 750,000', '', 9, 'Supply Chain');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '9.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '9.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 2);

-- 32. Item 9.5.1.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, interpretation)
VALUES ('9.5.1.1.1', 'COO Contracts: Annual Value > SAR 3M', '', 9, 'Supply Chain', 'E1*: Required if the contract/agreement is not on TAQA legal approved templates');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '9.5.1.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'X', 1),
((SELECT id FROM doa_items WHERE code = '9.5.1.1.1'), (SELECT id FROM roles WHERE name = 'COO'), 'X3*', 2),
((SELECT id FROM doa_items WHERE code = '9.5.1.1.1'), (SELECT id FROM roles WHERE name = 'CFO'), 'X2', 3),
((SELECT id FROM doa_items WHERE code = '9.5.1.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'E1*', 4);

-- 33. Item 10.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('10.1.1', 'Approve QHSE Policy', 'TAQA', 10, 'QHSE');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '10.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '10.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '10.1.1'), (SELECT id FROM roles WHERE name = 'QHSE'), 'R1', 3);

-- 34. Item 11.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('11.1.1', 'Initiate/Settle Litigation > SAR 5M', '', 11, 'Legal');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '11.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '11.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '11.1.1'), (SELECT id FROM roles WHERE name = 'General Counsel'), 'R1', 3);

-- 35. Item 12.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('12.1.1', 'Approve IT Strategy', 'TAQA', 12, 'Technology');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '12.1.1'), (SELECT id FROM roles WHERE name = 'BOD'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '12.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '12.1.1'), (SELECT id FROM roles WHERE name = 'CTO'), 'R1', 3);

-- 36. Item 13.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('13.1.1', 'Approve Enterprise Risk Management Framework', 'TAQA', 13, 'Risk');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '13.1.1'), (SELECT id FROM roles WHERE name = 'Risk & Sustainability'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '13.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '13.1.1'), (SELECT id FROM roles WHERE name = 'VP GRC'), 'R1', 3);

-- 37. Item 14.1.1
INSERT INTO doa_items (code, description, applies_to, category_id, business_owner)
VALUES ('14.1.1', 'Approve Internal Audit Charter', 'TAQA', 14, 'Internal Audit');

INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order) VALUES
((SELECT id FROM doa_items WHERE code = '14.1.1'), (SELECT id FROM roles WHERE name = 'Audit Committee'), 'X1', 1),
((SELECT id FROM doa_items WHERE code = '14.1.1'), (SELECT id FROM roles WHERE name = 'CEO'), 'E1', 2),
((SELECT id FROM doa_items WHERE code = '14.1.1'), (SELECT id FROM roles WHERE name = 'Internal Audit'), 'R1', 3);
