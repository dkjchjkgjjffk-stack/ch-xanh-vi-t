-- Cover foreign-key lookups used when deleting listings/products.
create index if not exists favorites_listing_id_idx
  on public.favorites (listing_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id)
  where product_id is not null;
