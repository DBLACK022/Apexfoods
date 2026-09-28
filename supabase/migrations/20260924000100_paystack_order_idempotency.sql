create table if not exists public.paystack_order_references (
  reference text primary key,
  order_id text,
  created_at timestamptz not null default now()
);

alter table public.paystack_order_references enable row level security;
revoke all on public.paystack_order_references from anon, authenticated;

create or replace function public.create_verified_paystack_order(
  p_reference text,
  p_order jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed_reference text;
  saved_order_id text;
begin
  insert into public.paystack_order_references (reference)
  values (p_reference)
  on conflict (reference) do nothing
  returning reference into claimed_reference;

  if claimed_reference is null then
    select order_id into saved_order_id
    from public.paystack_order_references
    where reference = p_reference;

    if saved_order_id is null then
      raise exception 'Payment reference is already being processed';
    end if;

    return saved_order_id;
  end if;

  insert into public."Orders" (
    customer_name,
    phone,
    email,
    address,
    items,
    "total price",
    payment_method,
    payment_status,
    order_status
  ) values (
    p_order->>'customer_name',
    p_order->>'phone',
    p_order->>'email',
    p_order->>'address',
    p_order->>'items',
    (p_order->>'total_price')::numeric,
    p_order->>'payment_method',
    p_order->>'payment_status',
    'New'
  ) returning id::text into saved_order_id;

  update public.paystack_order_references
  set order_id = saved_order_id
  where reference = p_reference;

  return saved_order_id;
end;
$$;

revoke all on function public.create_verified_paystack_order(text, jsonb) from public, anon, authenticated;
grant execute on function public.create_verified_paystack_order(text, jsonb) to service_role;
