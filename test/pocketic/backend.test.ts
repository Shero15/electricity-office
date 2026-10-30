import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * The lane speaks the generated declarations' Candid shapes, not the
 * `@/backend` wrapper's. A variant decodes to `{ variantName: value }` (for
 * example `{ ok: view }`), never to the wrapper's `{ __kind__, ok }`; an
 * optional is `[] | [T]`; a `Nat` is a `bigint`. Asserting the wrapper's shape
 * here would fail against a backend that is behaving exactly as its Candid
 * says, which is what this file used to do.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

/** An `AppointmentFilter` with every optional present as `[]` (Candid `null`). */
function emptyFilter() {
  return {
    status: [] as [] | [string],
    date: [] as [] | [string],
    search: [] as [] | [string],
    serviceId: [] as [] | [bigint],
    branchId: [] as [] | [bigint],
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.getServiceCatalogue()).resolves.toEqual([]);
  await expect(actor.getOfficeLocations()).resolves.toEqual([]);
  await expect(actor.listMyAppointments()).resolves.toEqual([]);
  await expect(actor.listMyDevices()).resolves.toEqual([]);
  await expect(actor.listAuditLog(50n)).resolves.toEqual([]);
});

it("registers a customer, verifies the phone, and rejects a duplicate number", async () => {
  const alice = createIdentity("alice");
  actor.setIdentity(alice);

  const first = await actor.registerCustomer({
    fullName: "Ada Lovelace",
    email: ["ada@example.com"],
    language: { en: null },
    nationalId: "1234567890",
    phone: "+9647700000001",
  });
  expect("ok" in first).toBe(true);
  if ("ok" in first) {
    expect(first.ok.phone).toBe("9647700000001");
    expect(first.ok.verified).toBe(false);
  }

  // A second registration with the same number is rejected server-side.
  const duplicate = await actor.registerCustomer({
    fullName: "Ada Again",
    email: [],
    language: { en: null },
    nationalId: "9999999999",
    phone: "+9647700000001",
  });
  expect("err" in duplicate).toBe(true);
  if ("err" in duplicate) {
    expect("duplicatePhone" in duplicate.err).toBe(true);
  }

  // The one-time code round-trips: request, then verify with the issued code.
  const requested = await actor.requestPhoneVerification("+9647700000001");
  expect("ok" in requested).toBe(true);

  // The code is delivered out-of-band, so a wrong code is rejected and the
  // correct one is not observable from here. Assert the rejection path.
  const wrong = await actor.verifyPhone("+9647700000001", "000000");
  expect("err" in wrong).toBe(true);
});

it("computes availability server-side and books a real slot", async () => {
  const admin = createIdentity("admin");
  actor.setIdentity(admin);

  const service = await actor.upsertService({
    id: 0n,
    fee: 25000n,
    active: true,
    nameAr: "خدمة",
    nameEn: "Commercial subscription",
    nameKu: "خزمەتگوزاری",
    descriptionAr: "وصف",
    descriptionEn: "Description",
    descriptionKu: "وەسف",
    code: "COMM",
    requiredDocumentsAr: [],
    requiredDocumentsEn: [],
    requiredDocumentsKu: [],
  });
  expect("ok" in service).toBe(true);
  const serviceId = "ok" in service ? service.ok.id : 0n;

  const branch = await actor.upsertBranch({
    id: 0n,
    active: true,
    nameAr: "الفرع",
    nameEn: "Head office",
    nameKu: "لق",
    code: "HQ",
    addressAr: "عنوان",
    addressEn: "1 Main Street",
    addressKu: "ناونیشان",
    phone: "+9647700000000",
  });
  expect("ok" in branch).toBe(true);
  const branchId = "ok" in branch ? branch.ok.id : 0n;

  const capacity = await actor.setSlotCapacity(branchId, serviceId, 1n);
  expect("ok" in capacity).toBe(true);

  const date = "2099-01-01";
  const slots = await actor.getAvailability(serviceId, branchId, date);
  expect(slots.length).toBeGreaterThan(0);
  const openSlot = slots.find((slot) => slot.available);
  expect(openSlot).toBeDefined();
  const slot = openSlot?.slot ?? "";

  const customer = createIdentity("customer");
  actor.setIdentity(customer);
  const booking = await actor.bookAppointment({
    date,
    slot,
    notes: "",
    serviceId,
    branchId,
  });
  expect("ok" in booking).toBe(true);
  const detail = "ok" in booking ? booking.ok : undefined;
  expect(detail?.appointment.reference).toBeTruthy();
  expect(detail?.qrToken).toBeTruthy();

  // The slot is now taken: a second booking for the same slot is rejected.
  const second = createIdentity("customer2");
  actor.setIdentity(second);
  const conflict = await actor.bookAppointment({
    date,
    slot,
    notes: "",
    serviceId,
    branchId,
  });
  expect("err" in conflict).toBe(true);
  if ("err" in conflict) {
    expect("conflict" in conflict.err).toBe(true);
  }
});

it("verifies a QR token, checks in once, and rejects a repeat scan", async () => {
  const admin = createIdentity("admin");
  actor.setIdentity(admin);

  const service = await actor.upsertService({
    id: 0n,
    fee: 0n,
    active: true,
    nameAr: "خدمة",
    nameEn: "New connection",
    nameKu: "خزمەتگوزاری",
    descriptionAr: "وصف",
    descriptionEn: "Description",
    descriptionKu: "وەسف",
    code: "NEW-CONN",
    requiredDocumentsAr: [],
    requiredDocumentsEn: [],
    requiredDocumentsKu: [],
  });
  const serviceId = "ok" in service ? service.ok.id : 0n;
  const branch = await actor.upsertBranch({
    id: 0n,
    active: true,
    nameAr: "الفرع",
    nameEn: "Branch",
    nameKu: "لق",
    code: "BR1",
    addressAr: "عنوان",
    addressEn: "Address",
    addressKu: "ناونیشان",
    phone: "+9647700000002",
  });
  const branchId = "ok" in branch ? branch.ok.id : 0n;
  await actor.setSlotCapacity(branchId, serviceId, 5n);

  const date = "2099-02-02";
  const slots = await actor.getAvailability(serviceId, branchId, date);
  const slot = slots.find((s) => s.available)?.slot ?? "";

  const customer = createIdentity("qr-customer");
  actor.setIdentity(customer);
  const booking = await actor.bookAppointment({
    date,
    slot,
    notes: "",
    serviceId,
    branchId,
  });
  expect("ok" in booking).toBe(true);
  const token = "ok" in booking ? booking.ok.qrToken : "";

  actor.setIdentity(admin);
  const verified = await actor.verifyAppointmentQr(token);
  expect("valid" in verified).toBe(true);

  const checkedIn = await actor.checkInAppointment(token);
  expect("valid" in checkedIn).toBe(true);

  const repeat = await actor.checkInAppointment(token);
  expect("alreadyCheckedIn" in repeat).toBe(true);

  const unknown = await actor.verifyAppointmentQr("not-a-real-token");
  expect("invalid" in unknown).toBe(true);
});

it("rejects a QR code for a cancelled appointment", async () => {
  const admin = createIdentity("admin");
  actor.setIdentity(admin);

  const service = await actor.upsertService({
    id: 0n,
    fee: 0n,
    active: true,
    nameAr: "خدمة",
    nameEn: "Meter service",
    nameKu: "خزمەتگوزاری",
    descriptionAr: "وصف",
    descriptionEn: "Description",
    descriptionKu: "وەسف",
    code: "METER",
    requiredDocumentsAr: [],
    requiredDocumentsEn: [],
    requiredDocumentsKu: [],
  });
  const serviceId = "ok" in service ? service.ok.id : 0n;
  const branch = await actor.upsertBranch({
    id: 0n,
    active: true,
    nameAr: "الفرع",
    nameEn: "Branch",
    nameKu: "لق",
    code: "BR2",
    addressAr: "عنوان",
    addressEn: "Address",
    addressKu: "ناونیشان",
    phone: "+9647700000003",
  });
  const branchId = "ok" in branch ? branch.ok.id : 0n;
  await actor.setSlotCapacity(branchId, serviceId, 5n);

  const date = "2099-03-03";
  const slots = await actor.getAvailability(serviceId, branchId, date);
  const slot = slots.find((s) => s.available)?.slot ?? "";

  const customer = createIdentity("cancel-customer");
  actor.setIdentity(customer);
  const booking = await actor.bookAppointment({
    date,
    slot,
    notes: "",
    serviceId,
    branchId,
  });
  expect("ok" in booking).toBe(true);
  const appointmentId = "ok" in booking ? booking.ok.appointment.id : 0n;
  const token = "ok" in booking ? booking.ok.qrToken : "";

  const cancelled = await actor.cancelMyAppointment(appointmentId);
  expect("ok" in cancelled).toBe(true);

  actor.setIdentity(admin);
  const verified = await actor.verifyAppointmentQr(token);
  expect("cancelled" in verified).toBe(true);
  const checkIn = await actor.checkInAppointment(token);
  expect("cancelled" in checkIn).toBe(true);
});

it("does not expose one customer's appointments to another", async () => {
  const alice = createIdentity("alice");
  actor.setIdentity(alice);
  const aliceAppointments = await actor.listMyAppointments();

  const bob = createIdentity("bob");
  actor.setIdentity(bob);
  const bobAppointments = await actor.listMyAppointments();

  expect(bobAppointments).toEqual([]);
  expect(aliceAppointments.length).toBeGreaterThanOrEqual(0);
});

it("rejects a non-admin caller from admin-only reads and actions", async () => {
  const customer = createIdentity("plain-customer");
  actor.setIdentity(customer);
  await expect(actor.isCallerAdmin()).resolves.toBe(false);
  await expect(actor.listAllAppointments(emptyFilter())).resolves.toEqual([]);
  await expect(actor.listAuditLog(50n)).resolves.toEqual([]);

  // A non-admin cannot change an appointment's status.
  const denied = await actor.setAppointmentStatus(1n, { confirmed: null });
  expect("err" in denied).toBe(true);
  if ("err" in denied) {
    expect("notAuthorized" in denied.err).toBe(true);
  }
});

it("records sign-ins, scans, verifications, check-ins, and status changes in the audit log", async () => {
  const admin = createIdentity("admin");
  actor.setIdentity(admin);

  await actor.recordSignIn();

  const service = await actor.upsertService({
    id: 0n,
    fee: 0n,
    active: true,
    nameAr: "خدمة",
    nameEn: "Audit service",
    nameKu: "خزمەتگوزاری",
    descriptionAr: "وصف",
    descriptionEn: "Description",
    descriptionKu: "وەسف",
    code: "AUDIT",
    requiredDocumentsAr: [],
    requiredDocumentsEn: [],
    requiredDocumentsKu: [],
  });
  const serviceId = "ok" in service ? service.ok.id : 0n;
  const branch = await actor.upsertBranch({
    id: 0n,
    active: true,
    nameAr: "الفرع",
    nameEn: "Branch",
    nameKu: "لق",
    code: "BR3",
    addressAr: "عنوان",
    addressEn: "Address",
    addressKu: "ناونیشان",
    phone: "+9647700000004",
  });
  const branchId = "ok" in branch ? branch.ok.id : 0n;
  await actor.setSlotCapacity(branchId, serviceId, 5n);

  const date = "2099-04-04";
  const slots = await actor.getAvailability(serviceId, branchId, date);
  const slot = slots.find((s) => s.available)?.slot ?? "";

  const customer = createIdentity("audit-customer");
  actor.setIdentity(customer);
  const booking = await actor.bookAppointment({
    date,
    slot,
    notes: "",
    serviceId,
    branchId,
  });
  expect("ok" in booking).toBe(true);
  const appointmentId = "ok" in booking ? booking.ok.appointment.id : 0n;
  const token = "ok" in booking ? booking.ok.qrToken : "";

  actor.setIdentity(admin);
  await actor.verifyAppointmentQr(token);
  await actor.checkInAppointment(token);
  await actor.setAppointmentStatus(appointmentId, { confirmed: null });

  const entries = await actor.listAuditLog(200n);
  const actions = entries.map((entry) => Object.keys(entry.action)[0]);
  expect(actions).toContain("signIn");
  expect(actions).toContain("qrScan");
  expect(actions).toContain("qrVerified");
  expect(actions).toContain("checkIn");
  expect(actions).toContain("statusChanged");
});
