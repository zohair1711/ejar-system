-- =========================================================
-- EJAR DATABASE HARDENING + CONSISTENCY MIGRATION
-- Purpose:
--   1) Fix syntax issue in contract_signed_documents
--   2) Add integrity constraints and helper indexes
--   3) Make contracts.unit_id the source of truth for the main unit
--   4) Make contracts.lessor_party_id / tenant_party_id the source of truth
--      for main parties while keeping contract_parties for extended roles
--   5) Prevent overlapping active contracts on the same unit
--   6) Keep units.status aligned with active contracts
--   7) Add logical validation helpers for party typing and unit/property consistency
--
-- Assumptions:
--   - One contract = one main unit
--   - contract_units remains for compatibility / future extension
--   - contract_parties remains for witnesses, representatives, and extra detail
-- =========================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- =========================================================
-- 0) FIX TYPO IN EXISTING TABLE IF NEEDED
-- If the original create table failed at contract_signed_documents,
-- create the table safely here.
-- =========================================================
create table if not exists public.contract_signed_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  document_type text not null,
  file_name text,
  file_url text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  ejar_signed_document_id text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_signed_documents_contract_id
  on public.contract_signed_documents(contract_id);

drop trigger if exists trg_contract_signed_documents_updated_at on public.contract_signed_documents;
create trigger trg_contract_signed_documents_updated_at
before update on public.contract_signed_documents
for each row execute function public.set_updated_at();

-- =========================================================
-- 1) CHECK CONSTRAINTS (NOT VALID first)
-- =========================================================
do $$
begin
  -- offices
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'unified_number'
  ) then
    alter table public.offices add column unified_number text;
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'brokerage_license_number'
  ) then
    alter table public.offices add column brokerage_license_number text;
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'tax_number'
  ) then
    alter table public.offices add column tax_number text;
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'phone'
  ) then
    alter table public.offices add column phone text;
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'email'
  ) then
    alter table public.offices add column email text;
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.offices'::regclass and attname = 'address_json'
  ) then
    alter table public.offices add column address_json jsonb;
  end if;

  -- properties
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.properties'::regclass and attname = 'additional_no'
  ) then
    alter table public.properties add column additional_no text;
  end if;

  -- parties
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.parties'::regclass and attname = 'identity_type'
  ) then
    alter table public.parties add column identity_type text;
  end if;

  -- constraints
  if not exists (
    select 1 from pg_constraint where conname = 'chk_offices_wallet_balance_non_negative'
  ) then
    alter table public.offices
      add constraint chk_offices_wallet_balance_non_negative
      check (wallet_balance >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_properties_status'
  ) then
    alter table public.properties
      add constraint chk_properties_status
      check (status in ('draft', 'active', 'inactive', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_properties_property_type'
  ) then
    alter table public.properties
      add constraint chk_properties_property_type
      check (property_type in ('building', 'villa', 'apartment_building', 'commercial_complex', 'land', 'warehouse')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_properties_usage_type'
  ) then
    alter table public.properties
      add constraint chk_properties_usage_type
      check (usage_type in ('residential', 'commercial', 'industrial', 'agricultural')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_property_ownership_documents_date_order'
  ) then
    alter table public.property_ownership_documents
      add constraint chk_property_ownership_documents_date_order
      check (
        issue_date is null or expiry_date is null or expiry_date >= issue_date
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_property_ownership_documents_status'
  ) then
    alter table public.property_ownership_documents
      add constraint chk_property_ownership_documents_status
      check (status in ('active', 'expired', 'revoked', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_property_ownership_documents_document_type'
  ) then
    alter table public.property_ownership_documents
      add constraint chk_property_ownership_documents_document_type
      check (document_type in ('electronic_deed', 'paper_deed', 'manual_deed', 'contract', 'other')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_property_owners_owner_type'
  ) then
    alter table public.property_owners
      add constraint chk_property_owners_owner_type
      check (owner_type in ('individual', 'organization')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_property_owners_ownership_ratio'
  ) then
    alter table public.property_owners
      add constraint chk_property_owners_ownership_ratio
      check (
        ownership_ratio is null or (ownership_ratio >= 0 and ownership_ratio <= 100)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_ownership_proxy_documents_date_order'
  ) then
    alter table public.ownership_proxy_documents
      add constraint chk_ownership_proxy_documents_date_order
      check (
        issue_date is null or expiry_date is null or expiry_date >= issue_date
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_area_non_negative'
  ) then
    alter table public.units
      add constraint chk_units_area_non_negative
      check (area is null or area >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_bedrooms_non_negative'
  ) then
    alter table public.units
      add constraint chk_units_bedrooms_non_negative
      check (bedrooms is null or bedrooms >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_bathrooms_non_negative'
  ) then
    alter table public.units
      add constraint chk_units_bathrooms_non_negative
      check (bathrooms is null or bathrooms >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_rent_expected_non_negative'
  ) then
    alter table public.units
      add constraint chk_units_rent_expected_non_negative
      check (rent_expected is null or rent_expected >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_status'
  ) then
    alter table public.units
      add constraint chk_units_status
      check (status in ('available', 'reserved', 'occupied', 'maintenance', 'inactive')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_unit_type'
  ) then
    alter table public.units
      add constraint chk_units_unit_type
      check (unit_type in ('apartment', 'shop', 'office', 'villa', 'warehouse')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_units_usage_type'
  ) then
    alter table public.units
      add constraint chk_units_usage_type
      check (usage_type in ('residential', 'commercial')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_parties_party_type'
  ) then
    alter table public.parties
      add constraint chk_parties_party_type
      check (party_type in ('individual', 'organization')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_parties_identity_type'
  ) then
    alter table public.parties
      add constraint chk_parties_identity_type
      check (identity_type in ('national_id', 'iqama', 'gcc_id', 'passport', 'cr_number', 'organization_id')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_parties_role_hint'
  ) then
    alter table public.parties
      add constraint chk_parties_role_hint
      check (
        role_hint is null or role_hint in ('lessor', 'tenant', 'broker', 'agent', 'representative', 'witness')
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_parties_individual_identity'
  ) then
    alter table public.parties
      add constraint chk_parties_individual_identity
      check (
        party_type <> 'individual'
        or coalesce(nullif(national_id, ''), nullif(iqama_no, '')) is not null
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_parties_organization_identity'
  ) then
    alter table public.parties
      add constraint chk_parties_organization_identity
      check (
        party_type <> 'organization'
        or nullif(cr_number, '') is not null
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contracts_date_order'
  ) then
    alter table public.contracts
      add constraint chk_contracts_date_order
      check (end_date > start_date) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contracts_contract_type'
  ) then
    alter table public.contracts
      add constraint chk_contracts_contract_type
      check (contract_type in ('lease')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contracts_contract_category'
  ) then
    alter table public.contracts
      add constraint chk_contracts_contract_category
      check (contract_category in ('residential', 'commercial')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contracts_status_internal'
  ) then
    alter table public.contracts
      add constraint chk_contracts_status_internal
      check (status_internal in ('draft', 'ready', 'active', 'expired', 'cancelled', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contracts_submit_status'
  ) then
    alter table public.contracts
      add constraint chk_contracts_submit_status
      check (submit_status in ('not_submitted', 'queued', 'submitted', 'synced', 'failed')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_parties_role'
  ) then
    alter table public.contract_parties
      add constraint chk_contract_parties_role
      check (role in ('lessor', 'tenant', 'representative', 'witness')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_parties_sequence_no'
  ) then
    alter table public.contract_parties
      add constraint chk_contract_parties_sequence_no
      check (sequence_no is null or sequence_no >= 1) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_proxy_documents_date_order'
  ) then
    alter table public.contract_proxy_documents
      add constraint chk_contract_proxy_documents_date_order
      check (
        issue_date is null or expiry_date is null or expiry_date >= issue_date
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_financial_info_amounts_non_negative'
  ) then
    alter table public.contract_financial_info
      add constraint chk_contract_financial_info_amounts_non_negative
      check (
        rent_amount >= 0
        and coalesce(security_deposit, 0) >= 0
        and coalesce(brokerage_fee, 0) >= 0
        and coalesce(vat_amount, 0) >= 0
        and coalesce(total_amount, 0) >= 0
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_financial_info_payment_frequency'
  ) then
    alter table public.contract_financial_info
      add constraint chk_contract_financial_info_payment_frequency
      check (payment_frequency in ('monthly', 'quarterly', 'semi-annually', 'annually')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_financial_info_payment_method'
  ) then
    alter table public.contract_financial_info
      add constraint chk_contract_financial_info_payment_method
      check (payment_method in ('mada', 'sadad', 'cash', 'bank_transfer')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_unit_services_amount_non_negative'
  ) then
    alter table public.contract_unit_services
      add constraint chk_contract_unit_services_amount_non_negative
      check (coalesce(amount, 0) >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_unit_services_service_name'
  ) then
    alter table public.contract_unit_services
      add constraint chk_contract_unit_services_service_name
      check (service_name in ('electricity', 'water', 'gas', 'sewage', 'maintenance', 'cleaning', 'security', 'parking', 'garbage_collection', 'other')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_rental_fees_amounts_non_negative'
  ) then
    alter table public.contract_rental_fees
      add constraint chk_contract_rental_fees_amounts_non_negative
      check (amount >= 0 and coalesce(vat_amount, 0) >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_invoices_amounts_non_negative'
  ) then
    alter table public.contract_invoices
      add constraint chk_contract_invoices_amounts_non_negative
      check (amount >= 0 and coalesce(vat_amount, 0) >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_contract_invoices_status'
  ) then
    alter table public.contract_invoices
      add constraint chk_contract_invoices_status
      check (status in ('pending', 'partially_paid', 'paid', 'cancelled', 'overdue')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_payments_amount_positive'
  ) then
    alter table public.payments
      add constraint chk_payments_amount_positive
      check (amount > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_payments_status'
  ) then
    alter table public.payments
      add constraint chk_payments_status
      check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_brokerage_agreements_date_order'
  ) then
    alter table public.brokerage_agreements
      add constraint chk_brokerage_agreements_date_order
      check (start_date is null or end_date is null or end_date > start_date) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_brokerage_agreements_status'
  ) then
    alter table public.brokerage_agreements
      add constraint chk_brokerage_agreements_status
      check (status in ('draft', 'active', 'expired', 'cancelled', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sync_jobs_attempt_count_non_negative'
  ) then
    alter table public.sync_jobs
      add constraint chk_sync_jobs_attempt_count_non_negative
      check (attempt_count >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sync_jobs_status'
  ) then
    alter table public.sync_jobs
      add constraint chk_sync_jobs_status
      check (status in ('pending', 'processing', 'done', 'failed', 'cancelled')) not valid;
  end if;
end $$;

-- =========================================================
-- 2) UNIQUE DEFAULT BANK ACCOUNT PER PARTY
-- =========================================================
create unique index if not exists uq_party_bank_accounts_one_default_per_party
  on public.party_bank_accounts(party_id)
  where is_default = true;

-- =========================================================
-- 3) ONE PRIMARY LESSOR / TENANT PER CONTRACT
-- =========================================================
create unique index if not exists uq_contract_parties_one_primary_per_role
  on public.contract_parties(contract_id, role)
  where is_primary = true and role in ('lessor', 'tenant');

-- =========================================================
-- 4) SYNC PRIMARY PARTIES INTO contracts
-- =========================================================
create or replace function public.sync_contract_primary_parties_to_contracts(
  p_contract_id uuid
)
returns void
language plpgsql
as $$
declare
  v_lessor uuid;
  v_tenant uuid;
begin
  select cp.party_id
    into v_lessor
  from public.contract_parties cp
  where cp.contract_id = p_contract_id
    and cp.role = 'lessor'
    and cp.is_primary = true
  order by cp.sequence_no nulls last, cp.created_at
  limit 1;

  select cp.party_id
    into v_tenant
  from public.contract_parties cp
  where cp.contract_id = p_contract_id
    and cp.role = 'tenant'
    and cp.is_primary = true
  order by cp.sequence_no nulls last, cp.created_at
  limit 1;

  update public.contracts c
     set lessor_party_id = v_lessor,
         tenant_party_id = v_tenant
   where c.id = p_contract_id;
end;
$$;

create or replace function public.trg_contract_parties_sync_contract_refs()
returns trigger
language plpgsql
as $$
declare
  v_contract_id uuid;
begin
  v_contract_id := coalesce(new.contract_id, old.contract_id);
  perform public.sync_contract_primary_parties_to_contracts(v_contract_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_contract_parties_sync_contract_refs on public.contract_parties;
create trigger trg_contract_parties_sync_contract_refs
after insert or update or delete on public.contract_parties
for each row
execute function public.trg_contract_parties_sync_contract_refs();

-- =========================================================
-- 5) SYNC contracts.unit_id INTO contract_units
-- =========================================================
create or replace function public.sync_contract_main_unit_to_contract_units(
  p_contract_id uuid
)
returns void
language plpgsql
as $$
declare
  v_unit_id uuid;
begin
  select c.unit_id
    into v_unit_id
  from public.contracts c
  where c.id = p_contract_id;

  if v_unit_id is null then
    delete from public.contract_units
    where contract_id = p_contract_id;
    return;
  end if;

  delete from public.contract_units
  where contract_id = p_contract_id
    and unit_id <> v_unit_id;

  insert into public.contract_units (contract_id, unit_id)
  values (p_contract_id, v_unit_id)
  on conflict (contract_id, unit_id) do nothing;
end;
$$;

create or replace function public.trg_contracts_sync_contract_units()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_contract_main_unit_to_contract_units(new.id);
  return new;
end;
$$;

drop trigger if exists trg_contracts_sync_contract_units on public.contracts;
create trigger trg_contracts_sync_contract_units
after insert or update of unit_id on public.contracts
for each row
execute function public.trg_contracts_sync_contract_units();

-- =========================================================
-- 6) BLOCK MANUAL contract_units MISMATCH
-- =========================================================
create or replace function public.prevent_contract_units_mismatch()
returns trigger
language plpgsql
as $$
declare
  v_main_unit uuid;
begin
  select c.unit_id
    into v_main_unit
  from public.contracts c
  where c.id = new.contract_id;

  if v_main_unit is null then
    raise exception 'Cannot insert into contract_units when contracts.unit_id is null for contract %', new.contract_id;
  end if;

  if new.unit_id <> v_main_unit then
    raise exception 'contract_units.unit_id (%) must match contracts.unit_id (%) for contract %',
      new.unit_id, v_main_unit, new.contract_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_contract_units_prevent_mismatch on public.contract_units;
create trigger trg_contract_units_prevent_mismatch
before insert or update on public.contract_units
for each row
execute function public.prevent_contract_units_mismatch();

-- =========================================================
-- 7) PREVENT property_id / unit_id MISMATCH IN contracts
-- =========================================================
create or replace function public.prevent_contract_property_unit_mismatch()
returns trigger
language plpgsql
as $$
declare
  v_unit_property_id uuid;
begin
  if new.unit_id is null or new.property_id is null then
    return new;
  end if;

  select u.property_id
    into v_unit_property_id
  from public.units u
  where u.id = new.unit_id;

  if v_unit_property_id is null then
    raise exception 'Selected unit % does not exist or has no property_id', new.unit_id;
  end if;

  if v_unit_property_id <> new.property_id then
    raise exception 'contracts.property_id (%) must match units.property_id (%) for unit %',
      new.property_id, v_unit_property_id, new.unit_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_contracts_prevent_property_unit_mismatch on public.contracts;
create trigger trg_contracts_prevent_property_unit_mismatch
before insert or update of property_id, unit_id on public.contracts
for each row
execute function public.prevent_contract_property_unit_mismatch();

-- =========================================================
-- 8) PREVENT OVERLAPPING ACTIVE CONTRACTS ON SAME UNIT
-- =========================================================
create or replace function public.prevent_overlapping_active_contracts()
returns trigger
language plpgsql
as $$
declare
  v_exists uuid;
begin
  if new.unit_id is null then
    return new;
  end if;

  if new.status_internal in ('draft', 'cancelled', 'archived', 'expired') then
    return new;
  end if;

  select c.id
    into v_exists
  from public.contracts c
  where c.unit_id = new.unit_id
    and c.id <> new.id
    and c.status_internal not in ('draft', 'cancelled', 'archived', 'expired')
    and daterange(c.start_date, c.end_date, '[]')
        && daterange(new.start_date, new.end_date, '[]')
  limit 1;

  if v_exists is not null then
    raise exception 'Unit % already has an overlapping active contract (%) in the same date range',
      new.unit_id, v_exists;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_contracts_prevent_overlapping_active_contracts on public.contracts;
create trigger trg_contracts_prevent_overlapping_active_contracts
before insert or update of unit_id, start_date, end_date, status_internal on public.contracts
for each row
execute function public.prevent_overlapping_active_contracts();

-- =========================================================
-- 9) KEEP UNIT STATUS IN SYNC
-- =========================================================
create or replace function public.refresh_unit_status_from_contracts(
  p_unit_id uuid
)
returns void
language plpgsql
as $$
declare
  v_has_active boolean;
begin
  if p_unit_id is null then
    return;
  end if;

  select exists (
    select 1
    from public.contracts c
    where c.unit_id = p_unit_id
      and c.status_internal = 'active'
      and current_date between c.start_date and c.end_date
  ) into v_has_active;

  update public.units u
     set status = case when v_has_active then 'occupied' else 'available' end
   where u.id = p_unit_id
     and u.status in ('available', 'occupied');
end;
$$;

create or replace function public.trg_contracts_refresh_unit_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_unit_status_from_contracts(old.unit_id);
    return old;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if tg_op = 'UPDATE' and old.unit_id is distinct from new.unit_id then
      perform public.refresh_unit_status_from_contracts(old.unit_id);
    end if;

    perform public.refresh_unit_status_from_contracts(new.unit_id);
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_contracts_refresh_unit_status on public.contracts;
create trigger trg_contracts_refresh_unit_status
after insert or update or delete on public.contracts
for each row
execute function public.trg_contracts_refresh_unit_status();

-- =========================================================
-- 10) COMMON SEARCH INDEXES
-- =========================================================
create index if not exists idx_contracts_contract_number_internal
  on public.contracts(contract_number_internal);

create index if not exists idx_contract_invoices_invoice_number
  on public.contract_invoices(invoice_number);

create index if not exists idx_parties_mobile
  on public.parties(mobile);

create index if not exists idx_parties_email
  on public.parties(email);

create index if not exists idx_units_unit_number
  on public.units(unit_number);

-- =========================================================
-- 11) VALIDATION QUERIES TO RUN BEFORE VALIDATE CONSTRAINTS
-- =========================================================
-- select * from public.contracts where end_date <= start_date;
-- select * from public.contracts c join public.units u on u.id = c.unit_id where c.property_id is not null and c.property_id <> u.property_id;
-- select * from public.parties where party_type = 'individual' and coalesce(nullif(national_id, ''), nullif(iqama_no, '')) is null;
-- select * from public.parties where party_type = 'organization' and nullif(cr_number, '') is null;
-- select * from public.contracts c1 join public.contracts c2 on c1.id <> c2.id and c1.unit_id = c2.unit_id
--   and c1.status_internal not in ('draft','cancelled','archived','expired')
--   and c2.status_internal not in ('draft','cancelled','archived','expired')
--   and daterange(c1.start_date, c1.end_date, '[]') && daterange(c2.start_date, c2.end_date, '[]');

commit;

-- =========================================================
-- AFTER CLEANING DIRTY DATA, VALIDATE CONSTRAINTS MANUALLY
-- =========================================================
-- alter table public.offices validate constraint chk_offices_wallet_balance_non_negative;
-- alter table public.properties validate constraint chk_properties_status;
-- alter table public.property_ownership_documents validate constraint chk_property_ownership_documents_date_order;
-- alter table public.property_ownership_documents validate constraint chk_property_ownership_documents_status;
-- alter table public.property_owners validate constraint chk_property_owners_owner_type;
-- alter table public.property_owners validate constraint chk_property_owners_ownership_ratio;
-- alter table public.ownership_proxy_documents validate constraint chk_ownership_proxy_documents_date_order;
-- alter table public.units validate constraint chk_units_area_non_negative;
-- alter table public.units validate constraint chk_units_bedrooms_non_negative;
-- alter table public.units validate constraint chk_units_bathrooms_non_negative;
-- alter table public.units validate constraint chk_units_rent_expected_non_negative;
-- alter table public.units validate constraint chk_units_status;
-- alter table public.parties validate constraint chk_parties_party_type;
-- alter table public.parties validate constraint chk_parties_role_hint;
-- alter table public.parties validate constraint chk_parties_individual_identity;
-- alter table public.parties validate constraint chk_parties_organization_identity;
-- alter table public.contracts validate constraint chk_contracts_date_order;
-- alter table public.contracts validate constraint chk_contracts_contract_type;
-- alter table public.contracts validate constraint chk_contracts_contract_category;
-- alter table public.contracts validate constraint chk_contracts_status_internal;
-- alter table public.contracts validate constraint chk_contracts_submit_status;
-- alter table public.contract_parties validate constraint chk_contract_parties_role;
-- alter table public.contract_parties validate constraint chk_contract_parties_sequence_no;
-- alter table public.contract_proxy_documents validate constraint chk_contract_proxy_documents_date_order;
-- alter table public.contract_financial_info validate constraint chk_contract_financial_info_amounts_non_negative;
-- alter table public.contract_unit_services validate constraint chk_contract_unit_services_amount_non_negative;
-- alter table public.contract_rental_fees validate constraint chk_contract_rental_fees_amounts_non_negative;
-- alter table public.contract_invoices validate constraint chk_contract_invoices_amounts_non_negative;
-- alter table public.contract_invoices validate constraint chk_contract_invoices_status;
-- alter table public.payments validate constraint chk_payments_amount_positive;
-- alter table public.payments validate constraint chk_payments_status;
-- alter table public.brokerage_agreements validate constraint chk_brokerage_agreements_date_order;
-- alter table public.brokerage_agreements validate constraint chk_brokerage_agreements_status;
-- alter table public.sync_jobs validate constraint chk_sync_jobs_attempt_count_non_negative;
-- alter table public.sync_jobs validate constraint chk_sync_jobs_status;
