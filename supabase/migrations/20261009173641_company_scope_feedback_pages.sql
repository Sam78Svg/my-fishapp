-- Applied to the connected Supabase project as migration 20261009173641.
-- campaigns.company_name already existed in that project.
ALTER TABLE public.templates ADD COLUMN company_name VARCHAR(255);
ALTER TABLE public.links ADD COLUMN company_name VARCHAR(255);
ALTER TABLE public.tracking ADD COLUMN company_name VARCHAR(255);
ALTER TABLE public.tracking ADD COLUMN campaign_id INTEGER REFERENCES public.campaigns(id) ON DELETE CASCADE;
ALTER TABLE public.campaigns
  ADD COLUMN feedback_page_type TEXT NOT NULL DEFAULT 'generic'
  CHECK (feedback_page_type IN ('generic', 'google', 'microsoft'));

UPDATE public.templates t
SET company_name = matches.company_name
FROM (
  SELECT t2.id, MIN(c.company_name) AS company_name
  FROM public.templates t2
  JOIN public.campaigns c ON c.template_type = t2.name
  WHERE c.company_name IS NOT NULL
  GROUP BY t2.id
  HAVING COUNT(DISTINCT c.company_name) = 1
) matches
WHERE t.id = matches.id AND t.company_name IS NULL;

UPDATE public.links l
SET company_name = matches.company_name
FROM (
  SELECT l2.link_id, MIN(c.company_name) AS company_name
  FROM public.links l2
  JOIN public.campaigns c
    ON c.target_group = l2.target_group AND c.template_type = l2.template_type
  WHERE c.company_name IS NOT NULL
  GROUP BY l2.link_id
  HAVING COUNT(DISTINCT c.company_name) = 1
) matches
WHERE l.link_id = matches.link_id AND l.company_name IS NULL;

UPDATE public.tracking t
SET campaign_id = matches.campaign_id, company_name = matches.company_name
FROM (
  SELECT t2.id AS tracking_id, MIN(c.id) AS campaign_id, MIN(c.company_name) AS company_name
  FROM public.tracking t2
  JOIN public.campaigns c ON c.name = t2.campaign_name
  WHERE c.company_name IS NOT NULL
  GROUP BY t2.id
  HAVING COUNT(c.id) = 1
) matches
WHERE t.id = matches.tracking_id AND t.campaign_id IS NULL;
