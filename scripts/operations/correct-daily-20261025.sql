-- Owner-approved, one-time content correction. Not an automatic migration.
-- Execute this entire statement in one transaction; any failed guard aborts it.
DO $correction$
DECLARE
 target constant uuid := '3ab17e80-bfa7-45a7-b6f0-5d70e1c26199';
 original public.daily_practice_batches;
 draft public.daily_practice_drafts;
 candidate jsonb;
 result public.daily_practice_batches;
 entry record;
 path text[];
BEGIN
 SELECT * INTO STRICT draft FROM public.daily_practice_drafts WHERE id=target FOR UPDATE;
 SELECT * INTO STRICT original FROM public.daily_practice_batches WHERE id=target FOR UPDATE;
 IF original.revision<>1 OR draft.revision<>1 OR draft.status<>'published'
 OR original.effective_from<>DATE '2026-10-09' OR draft.effective_from<>original.effective_from
 OR original.document->>'id'<>'authored-2026-10-depth'
 OR md5(original.document::text)<>'de727a5648082f5230dd7f34dc0aee17'
 OR draft.document IS DISTINCT FROM original.document THEN
  RAISE EXCEPTION 'Daily correction checkpoint changed; stop and review';
 END IF;
 candidate:=original.document;
 FOR entry IN SELECT value AS exercise, ordinality-1 AS position
 FROM jsonb_array_elements(candidate->'exercises') WITH ORDINALITY LOOP
  path:=ARRAY['exercises',entry.position::text,'visual'];
  CASE entry.exercise->>'id'
   WHEN 'practice-18' THEN
    candidate:=jsonb_set(candidate,path||ARRAY['bars','2','label'],'"Total fees"');
    candidate:=jsonb_set(candidate,path||ARRAY['bars','2','value'],'10');
   WHEN 'practice-24' THEN
    candidate:=jsonb_set(candidate,path||ARRAY['bars','0','value'],'2880');
    candidate:=jsonb_set(candidate,path||ARRAY['bars','1','value'],'2');
    candidate:=jsonb_set(candidate,path||ARRAY['unit'],'"illustrative age in minutes"');
   WHEN 'practice-32' THEN
    candidate:=jsonb_set(candidate,path||ARRAY['bars','0','value'],'3');
    candidate:=jsonb_set(candidate,path||ARRAY['bars','1','value'],'4');
   ELSE NULL;
  END CASE;
 END LOOP;
 IF NOT tradehq_private.daily_exercises_valid(candidate->'exercises')
 OR jsonb_array_length(candidate->'exercises')<>50
 OR (SELECT sum(jsonb_array_length(e->'questions')) FROM jsonb_array_elements(candidate->'exercises') e)<>500 THEN
  RAISE EXCEPTION 'Corrected bank failed full validation';
 END IF;
 PERFORM public.save_daily_practice(target,1,candidate);
 PERFORM public.publish_daily_practice(target,2,'Owner-approved editorial correction 2026-10-25');
 -- The general publisher uses the draft UUID as document ID. This seeded bank
 -- already has a stable public ID used by local progress; retain that identity.
 -- Publication revision/reviewer/timestamps still come from the normal publisher.
 UPDATE public.daily_practice_batches
 SET document=jsonb_set(document,'{id}',original.document->'id') WHERE id=target;
 SELECT * INTO STRICT result FROM public.daily_practice_batches WHERE id=target;
 IF result.revision<>2 OR result.effective_from<>original.effective_from
 OR (result.document-'reviewer'-'reviewedAt') IS DISTINCT FROM candidate
 OR result.document->>'reviewer'<>'Owner-approved editorial correction 2026-10-25'
 OR (SELECT status FROM public.daily_practice_drafts WHERE id=target)<>'published' THEN
  RAISE EXCEPTION 'Published correction failed invariants';
 END IF;
END;
$correction$;
