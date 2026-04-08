-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- OFFICES
-- =========================================================
create table if not exists public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office_code text,
  commercial_registration text,
  ejar_office_id text,
  wallet_balance numeric(14,2) default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_offices_updated_at
before update on public.offices
for each row execute function public.set_updated_at();

-- =========================================================
-- PROPERTIES
-- =========================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  property_code text,
  name text not null,
  property_type text not null,
  usage_type text,
  city text,
  district text,
  street text,
  building_no text,
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  ejar_property_id text,
  status text not null default 'draft',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (office_id, property_code)
);

create index if not exists idx_properties_office_id on public.properties(office_id);
create index if not exists idx_properties_ejar_property_id on public.properties(ejar_property_id);

create trigger trg_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

-- =========================================================
-- PROPERTY OWNERSHIP DOCUMENTS
-- =========================================================
create table if not exists public.property_ownership_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  document_type text not null,
  document_number text not null,
  issue_date date,
  expiry_date date,
  issuer_name text,
  file_url text,
  ejar_document_id text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_ownership_documents_property_id
  on public.property_ownership_documents(property_id);

create trigger trg_property_ownership_documents_updated_at
before update on public.property_ownership_documents
for each row execute function public.set_updated_at();

-- =========================================================
-- PROPERTY OWNERS
-- =========================================================
create table if not exists public.property_owners (
  id uuid primary key default gen_random_uuid(),
  ownership_document_id uuid not null references public.property_ownership_documents(id) on delete cascade,
  owner_type text not null, -- individual | organization
  name text not null,
  national_id_or_cr text,
  mobile text,
  email text,
  ownership_ratio numeric(5,2),
  ejar_entity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_owners_ownership_document_id
  on public.property_owners(ownership_document_id);

create trigger trg_property_owners_updated_at
before update on public.property_owners
for each row execute function public.set_updated_at();

-- =========================================================
-- OWNERSHIP PROXY DOCUMENTS
-- =========================================================
create table if not exists public.ownership_proxy_documents (
  id uuid primary key default gen_random_uuid(),
  ownership_document_id uuid not null references public.property_ownership_documents(id) on delete cascade,
  owner_id uuid references public.property_owners(id) on delete set null,
  proxy_holder_name text not null,
  proxy_holder_id text,
  proxy_number text not null,
  issue_date date,
  expiry_date date,
  file_url text,
  ejar_proxy_document_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ownership_proxy_documents_ownership_document_id
  on public.ownership_proxy_documents(ownership_document_id);

create trigger trg_ownership_proxy_documents_updated_at
before update on public.ownership_proxy_documents
for each row execute function public.set_updated_at();

-- =========================================================
-- UNITS
-- =========================================================
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_number text not null,
  floor_number text,
  unit_type text not null,
  usage_type text,
  area numeric(12,2),
  bedrooms integer,
  bathrooms integer,
  furnished boolean default false,
  electricity_no text,
  water_no text,
  meter_info text,
  advertisement_number text,
  rent_expected numeric(14,2),
  ejar_unit_id text,
  status text not null default 'available',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_number)
);

create index if not exists idx_units_property_id on public.units(property_id);
create index if not exists idx_units_ejar_unit_id on public.units(ejar_unit_id);
create index if not exists idx_units_status on public.units(status);

create trigger trg_units_updated_at
before update on public.units
for each row execute function public.set_updated_at();

-- =========================================================
-- PARTIES
-- =========================================================
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  party_type text not null, -- individual | organization
  role_hint text, -- lessor | tenant | broker | agent
  full_name text not null,
  arabic_name text,
  national_id text,
  iqama_no text,
  cr_number text,
  date_of_birth date,
  mobile text,
  email text,
  nationality text,
  address_json jsonb,
  ejar_entity_id text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_parties_party_type on public.parties(party_type);
create index if not exists idx_parties_national_id on public.parties(national_id);
create index if not exists idx_parties_cr_number on public.parties(cr_number);
create index if not exists idx_parties_ejar_entity_id on public.parties(ejar_entity_id);

create trigger trg_parties_updated_at
before update on public.parties
for each row execute function public.set_updated_at();

-- =========================================================
-- PARTY BANK ACCOUNTS
-- =========================================================
create table if not exists public.party_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  iban text not null,
  bank_name text,
  account_holder_name text,
  is_default boolean not null default false,
  ejar_iban_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_party_bank_accounts_party_iban
  on public.party_bank_accounts(party_id, iban);

create index if not exists idx_party_bank_accounts_party_id
  on public.party_bank_accounts(party_id);

create trigger trg_party_bank_accounts_updated_at
before update on public.party_bank_accounts
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACTS
-- =========================================================
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,

  lessor_party_id uuid references public.parties(id) on delete set null,
  tenant_party_id uuid references public.parties(id) on delete set null,

  contract_type text not null default 'lease',
  contract_category text not null default 'residential', -- residential | commercial
  contract_number_internal text not null,
  ejar_contract_id text,
  ejar_contract_number text,

  start_date date not null,
  end_date date not null,

  status_internal text not null default 'draft',
  status_ejar text,
  submit_status text not null default 'not_submitted',

  submitted_at timestamptz,
  archived_at timestamptz,
  api_version text,
  raw_payload jsonb,
  last_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (office_id, contract_number_internal)
);

create index if not exists idx_contracts_office_id on public.contracts(office_id);
create index if not exists idx_contracts_property_id on public.contracts(property_id);
create index if not exists idx_contracts_unit_id on public.contracts(unit_id);
create index if not exists idx_contracts_lessor_party_id on public.contracts(lessor_party_id);
create index if not exists idx_contracts_tenant_party_id on public.contracts(tenant_party_id);
create index if not exists idx_contracts_ejar_contract_id on public.contracts(ejar_contract_id);
create index if not exists idx_contracts_ejar_contract_number on public.contracts(ejar_contract_number);
create index if not exists idx_contracts_status_internal on public.contracts(status_internal);
create index if not exists idx_contracts_status_ejar on public.contracts(status_ejar);

create trigger trg_contracts_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT UNITS
-- =========================================================
create table if not exists public.contract_units (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  ejar_contract_unit_id text,
  usage_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, unit_id)
);

create index if not exists idx_contract_units_contract_id on public.contract_units(contract_id);
create index if not exists idx_contract_units_unit_id on public.contract_units(unit_id);

create trigger trg_contract_units_updated_at
before update on public.contract_units
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT COMMERCIAL EXTRA INFO
-- =========================================================
create table if not exists public.contract_commercial_extra_info (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts(id) on delete cascade,
  activity_type text,
  activity_description text,
  license_number text,
  extra_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_contract_commercial_extra_info_updated_at
before update on public.contract_commercial_extra_info
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT PARTIES
-- =========================================================
create table if not exists public.contract_parties (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  role text not null, -- lessor | tenant | representative | witness
  is_primary boolean not null default false,
  sequence_no integer default 1,
  ejar_contract_party_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_parties_contract_id on public.contract_parties(contract_id);
create index if not exists idx_contract_parties_party_id on public.contract_parties(party_id);
create index if not exists idx_contract_parties_role on public.contract_parties(role);

create trigger trg_contract_parties_updated_at
before update on public.contract_parties
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT PROXY DOCUMENTS
-- =========================================================
create table if not exists public.contract_proxy_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  contract_party_id uuid references public.contract_parties(id) on delete set null,
  proxy_number text not null,
  proxy_type text,
  issue_date date,
  expiry_date date,
  file_url text,
  ejar_proxy_document_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_proxy_documents_contract_id
  on public.contract_proxy_documents(contract_id);

create trigger trg_contract_proxy_documents_updated_at
before update on public.contract_proxy_documents
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT FINANCIAL INFO
-- =========================================================
create table if not exists public.contract_financial_info (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts(id) on delete cascade,
  rent_amount numeric(14,2) not null default 0,
  payment_frequency text,
  payment_method text,
  security_deposit numeric(14,2) default 0,
  brokerage_fee numeric(14,2) default 0,
  vat_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  currency_code text default 'SAR',
  lessor_iban_id uuid references public.party_bank_accounts(id) on delete set null,
  tenant_iban_id uuid references public.party_bank_accounts(id) on delete set null,
  financial_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_contract_financial_info_updated_at
before update on public.contract_financial_info
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT UNIT SERVICES
-- =========================================================
create table if not exists public.contract_unit_services (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  contract_unit_id uuid references public.contract_units(id) on delete set null,
  service_name text not null,
  service_type text,
  amount numeric(14,2) default 0,
  billing_cycle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_unit_services_contract_id
  on public.contract_unit_services(contract_id);

create trigger trg_contract_unit_services_updated_at
before update on public.contract_unit_services
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT RENTAL FEES
-- =========================================================
create table if not exists public.contract_rental_fees (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  fee_type text not null,
  amount numeric(14,2) not null default 0,
  vat_amount numeric(14,2) default 0,
  is_recurring boolean not null default false,
  due_rule text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_rental_fees_contract_id
  on public.contract_rental_fees(contract_id);

create trigger trg_contract_rental_fees_updated_at
before update on public.contract_rental_fees
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT TERMS
-- =========================================================
create table if not exists public.contract_terms (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  term_code text,
  term_title text not null,
  term_text text not null,
  is_default boolean not null default true,
  sort_order integer default 1,
  ejar_term_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_terms_contract_id
  on public.contract_terms(contract_id);

create trigger trg_contract_terms_updated_at
before update on public.contract_terms
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT CUSTOM TERMS
-- =========================================================
create table if not exists public.contract_custom_terms (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  title text,
  term_text text not null,
  sort_order integer default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_custom_terms_contract_id
  on public.contract_custom_terms(contract_id);

create trigger trg_contract_custom_terms_updated_at
before update on public.contract_custom_terms
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT SIGNED DOCUMENTS
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

create trigger trg_contract_signed_documents_updated_at
before update on public.contract_signed_documents
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT ADVERTISEMENTS
-- =========================================================
create table if not exists public.contract_advertisements (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  advertisement_number text not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_advertisements_contract_id
  on public.contract_advertisements(contract_id);

create trigger trg_contract_advertisements_updated_at
before update on public.contract_advertisements
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRACT STATUS HISTORY
-- =========================================================
create table if not exists public.contract_status_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  status_source text not null, -- internal | ejar
  old_status text,
  new_status text not null,
  reason text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_status_history_contract_id
  on public.contract_status_history(contract_id);

create index if not exists idx_contract_status_history_created_at
  on public.contract_status_history(created_at desc);

-- =========================================================
-- CONTRACT INVOICES
-- =========================================================
create table if not exists public.contract_invoices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  invoice_number text,
  invoice_type text,
  amount numeric(14,2) not null default 0,
  vat_amount numeric(14,2) default 0,
  total_amount numeric(14,2) generated always as (amount + coalesce(vat_amount, 0)) stored,
  due_date date,
  paid_at timestamptz,
  status text not null default 'pending',
  ejar_invoice_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_invoices_contract_id
  on public.contract_invoices(contract_id);

create index if not exists idx_contract_invoices_status
  on public.contract_invoices(status);

create trigger trg_contract_invoices_updated_at
before update on public.contract_invoices
for each row execute function public.set_updated_at();

-- =========================================================
-- BROKERAGE AGREEMENTS
-- =========================================================
create table if not exists public.brokerage_agreements (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  party_id uuid references public.parties(id) on delete set null,
  agreement_number text,
  start_date date,
  end_date date,
  status text not null default 'draft',
  ejar_agreement_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brokerage_agreements_office_id
  on public.brokerage_agreements(office_id);

create trigger trg_brokerage_agreements_updated_at
before update on public.brokerage_agreements
for each row execute function public.set_updated_at();

-- =========================================================
-- PAYMENTS (INTERNAL BUSINESS PAYMENTS)
-- =========================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  invoice_id uuid references public.contract_invoices(id) on delete set null,
  amount numeric(14,2) not null,
  due_date date,
  paid_at timestamptz,
  payment_method text,
  reference_number text,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_contract_id on public.payments(contract_id);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_payments_status on public.payments(status);

create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- =========================================================
-- EJAR API LOGS
-- =========================================================
create table if not exists public.ejar_api_logs (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete set null,
  entity_type text,
  entity_id uuid,
  endpoint text not null,
  http_method text not null,
  request_headers_redacted jsonb,
  request_body jsonb,
  response_status integer,
  response_body jsonb,
  is_success boolean,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ejar_api_logs_contract_id
  on public.ejar_api_logs(contract_id);

create index if not exists idx_ejar_api_logs_created_at
  on public.ejar_api_logs(created_at desc);

-- =========================================================
-- SYNC JOBS
-- =========================================================
create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null, -- submit_contract | sync_status | fetch_invoices | download_pdf
  reference_type text not null,
  reference_id uuid,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  next_run_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sync_jobs_status on public.sync_jobs(status);
create index if not exists idx_sync_jobs_next_run_at on public.sync_jobs(next_run_at);

create trigger trg_sync_jobs_updated_at
before update on public.sync_jobs
for each row execute function public.set_updated_at();

-- =========================================================
-- USEFUL VIEWS
-- =========================================================
create or replace view public.v_contract_overview as
select
  c.id,
  c.contract_number_internal,
  c.ejar_contract_number,
  c.contract_type,
  c.contract_category,
  c.start_date,
  c.end_date,
  c.status_internal,
  c.status_ejar,
  c.submit_status,
  o.name as office_name,
  p.name as property_name,
  u.unit_number,
  lp.full_name as lessor_name,
  tp.full_name as tenant_name,
  c.created_at,
  c.updated_at
from public.contracts c
left join public.offices o on o.id = c.office_id
left join public.properties p on p.id = c.property_id
left join public.units u on u.id = c.unit_id
left join public.parties lp on lp.id = c.lessor_party_id
left join public.parties tp on tp.id = c.tenant_party_id;

-- =========================================================
-- OPTIONAL HELPER FUNCTION
-- =========================================================
create or replace function public.add_contract_status_history(
  p_contract_id uuid,
  p_status_source text,
  p_old_status text,
  p_new_status text,
  p_reason text default null,
  p_raw_payload jsonb default null
)
returns void
language plpgsql
as $$
begin
  insert into public.contract_status_history (
    contract_id,
    status_source,
    old_status,
    new_status,
    reason,
    raw_payload
  )
  values (
    p_contract_id,
    p_status_source,
    p_old_status,
    p_new_status,
    p_reason,
    p_raw_payload
  );
end;
$$;