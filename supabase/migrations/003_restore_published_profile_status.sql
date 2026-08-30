-- Keep already-posted profiles reachable after publication_status hardening.
-- Older publish flows saved snapshots but could leave publication_status='draft',
-- causing public handles to show the unpublished/not-taken 404.

update public.profiles
set publication_status = 'published'
where publication_status = 'draft'
  and account_status in ('active', 'warning')
  and (
    published_at is not null
    or published_profile is not null
    or (
      published_blocks is not null
      and jsonb_typeof(published_blocks) = 'array'
      and jsonb_array_length(published_blocks) > 0
    )
  );
