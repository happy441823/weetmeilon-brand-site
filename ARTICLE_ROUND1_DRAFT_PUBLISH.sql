UPDATE articles
SET status = 'published',
    indexable = 1,
    published_at = '2026-06-27T03:47:44.936Z',
    first_published_at = COALESCE(first_published_at, '2026-06-27T03:47:44.936Z'),
    scheduled_at = NULL,
    updated_at = '2026-06-27T03:47:44.936Z'
WHERE slug IN ('tpe-vs-silicone-material-guide','cleaning-and-storage-guide','how-to-choose-cup-products','mold-products-care-guide')
  AND status = 'draft'
  AND indexable = 0;
