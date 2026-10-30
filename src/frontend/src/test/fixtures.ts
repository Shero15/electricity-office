import type {
  AppointmentDetail,
  AppointmentView,
  BranchView,
  CustomerView,
  DeviceView,
  Language,
  QrVerification,
  ServiceView,
} from "@/backend";
import { AppointmentStatus } from "@/backend";

/**
 * Typed fixtures for the generated backend interface. These mirror the shapes
 * the app's own `@/backend` wrapper exposes (options as `T | undefined`,
 * statuses as the `AppointmentStatus` enum), so component tests exercise the
 * same contract the real actor returns.
 */

export function makeService(overrides: Partial<ServiceView> = {}): ServiceView {
  return {
    id: 1n,
    fee: 25000n,
    active: true,
    nameAr: "خدمة تجريبية",
    nameEn: "Commercial subscription",
    nameKu: "بەشداری بازرگانی",
    descriptionAr: "وصف الخدمة",
    descriptionEn: "Service description",
    descriptionKu: "وەسفی خزمەتگوزاری",
    code: "COMM",
    requiredDocumentsAr: ["هوية"],
    requiredDocumentsEn: ["Identity document"],
    requiredDocumentsKu: ["ناسنامە"],
    ...overrides,
  };
}

export function makeBranch(overrides: Partial<BranchView> = {}): BranchView {
  return {
    id: 1n,
    active: true,
    nameAr: "الفرع الرئيسي",
    nameEn: "Head office",
    nameKu: "ئۆفیسی سەرەکی",
    code: "HQ",
    addressAr: "العنوان",
    addressEn: "1 Main Street",
    addressKu: "ناونیشان",
    phone: "+964 770 000 0000",
    ...overrides,
  };
}

export function makeAppointment(
  overrides: Partial<AppointmentView> = {},
): AppointmentView {
  return {
    id: 1n,
    status: AppointmentStatus.requested,
    date: "2099-01-01",
    createdAt: 1_700_000_000_000_000_000n,
    slot: "09:00",
    reference: "ELC-2026-000123",
    updatedAt: 1_700_000_000_000_000_000n,
    notes: "",
    serviceId: 1n,
    branchId: 1n,
    ...overrides,
  };
}

export function makeAppointmentDetail(
  overrides: Partial<AppointmentDetail> = {},
): AppointmentDetail {
  return {
    service: makeService(),
    branch: makeBranch(),
    appointment: makeAppointment(),
    qrToken: "tok_abc123",
    ...overrides,
  };
}

export function makeCustomer(
  overrides: Partial<CustomerView> = {},
): CustomerView {
  return {
    id: 1n,
    verified: true,
    createdAt: 1_700_000_000_000_000_000n,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    language: "en" as unknown as Language,
    nationalId: "1234567890",
    phone: "+9647700000000",
    ...overrides,
  };
}

export function makeDevice(overrides: Partial<DeviceView> = {}): DeviceView {
  return {
    id: 1n,
    revoked: false,
    lastSeenAt: 1_700_000_000_000_000_000n,
    createdAt: 1_700_000_000_000_000_000n,
    deviceLabel: "Office laptop",
    ...overrides,
  };
}

export function makeQrVerification(
  kind: "valid" | "cancelled" | "alreadyCheckedIn",
  detail: AppointmentDetail = makeAppointmentDetail(),
): QrVerification {
  if (kind === "valid") return { __kind__: "valid", valid: detail };
  if (kind === "cancelled") return { __kind__: "cancelled", cancelled: detail };
  return { __kind__: "alreadyCheckedIn", alreadyCheckedIn: detail };
}
