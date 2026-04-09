/**
 * Ejar Lookup Codes
 * These values must match the official Ejar ECRS API lookup values.
 */

export const EjarPropertyTypes = [
  { value: 'building', label: 'عمارة' },
  { value: 'villa', label: 'فيلا' },
  { value: 'apartment_building', label: 'مبنى شقق' },
  { value: 'commercial_complex', label: 'مجمع تجاري' },
  { value: 'land', label: 'أرض' },
  { value: 'warehouse', label: 'مستودع' },
];

export const EjarUnitTypes = [
  { value: 'apartment', label: 'شقة' },
  { value: 'shop', label: 'محل' },
  { value: 'office', label: 'مكتب' },
  { value: 'villa', label: 'فيلا' },
  { value: 'warehouse', label: 'مستودع' },
];

export const EjarUsageTypes = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'agricultural', label: 'زراعي' },
];

export const EjarIdentityTypes = [
  { value: 'national_id', label: 'هوية وطنية' },
  { value: 'iqama', label: 'إقامة' },
  { value: 'gcc_id', label: 'هوية خليجية' },
  { value: 'passport', label: 'جواز سفر' },
  { value: 'cr_number', label: 'سجل تجاري' },
  { value: 'organization_id', label: 'رقم المنشأة (700)' },
];

export const EjarDocumentTypes = [
  { value: 'electronic_deed', label: 'صك إلكتروني' },
  { value: 'paper_deed', label: 'صك ورقي' },
  { value: 'manual_deed', label: 'صك يدوي' },
  { value: 'contract', label: 'عقد استثمار/أخرى' },
];

export const EjarPaymentFrequencies = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'semi-annual', label: 'نصف سنوي' },
  { value: 'annual', label: 'سنوي' },
];

export const EjarPaymentMethods = [
  { value: 'mada', label: 'مدى' },
  { value: 'sadad', label: 'سداد' },
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
];

export const EjarServiceNames = [
  { value: 'electricity', label: 'كهرباء' },
  { value: 'water', label: 'مياه' },
  { value: 'gas', label: 'غاز' },
  { value: 'sewage', label: 'صرف صحي' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'cleaning', label: 'نظافة' },
  { value: 'security', label: 'حراسة' },
  { value: 'parking', label: 'مواقف' },
  { value: 'garbage_collection', label: 'جمع نفايات' },
  { value: 'other', label: 'أخرى' },
];
