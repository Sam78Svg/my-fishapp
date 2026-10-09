-- Run once against the application database before deploying the company-scoped API.
ALTER TABLE campaigns ADD COLUMN company_name VARCHAR(255) NULL;
ALTER TABLE templates ADD COLUMN company_name VARCHAR(255) NULL;
ALTER TABLE links ADD COLUMN company_name VARCHAR(255) NULL;
ALTER TABLE tracking ADD COLUMN company_name VARCHAR(255) NULL;

-- Backfill legacy rows only where the existing data identifies one company unambiguously.
UPDATE campaigns c
JOIN (
    SELECT department, MIN(company_name) AS company_name
    FROM users
    GROUP BY department
    HAVING COUNT(DISTINCT company_name) = 1
) u ON u.department = c.target_group
SET c.company_name = u.company_name
WHERE c.company_name IS NULL;

UPDATE templates t
JOIN (
    SELECT template_type, MIN(company_name) AS company_name
    FROM campaigns
    WHERE company_name IS NOT NULL
    GROUP BY template_type
    HAVING COUNT(DISTINCT company_name) = 1
) c ON c.template_type = t.name
SET t.company_name = c.company_name
WHERE t.company_name IS NULL;

UPDATE links l
JOIN (
    SELECT target_group, template_type, MIN(company_name) AS company_name
    FROM campaigns
    WHERE company_name IS NOT NULL
    GROUP BY target_group, template_type
    HAVING COUNT(DISTINCT company_name) = 1
) c ON c.target_group = l.target_group AND c.template_type = l.template_type
SET l.company_name = c.company_name
WHERE l.company_name IS NULL;

UPDATE tracking t
JOIN users u ON u.email = t.email
SET t.company_name = u.company_name
WHERE t.company_name IS NULL;
