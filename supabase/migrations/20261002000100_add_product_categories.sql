-- Add optional categories without changing existing product availability or data.
alter table public.products
  add column if not exists category text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_category_allowed_values'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_allowed_values
      check (
        category is null
        or category in ('Grains', 'Oils', 'Proteins', 'Tubers', 'Others & Spices')
      );
  end if;
end $$;
