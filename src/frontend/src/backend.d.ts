import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppointmentDetail {
    service?: ServiceView;
    branch?: BranchView;
    appointment: AppointmentView;
    qrToken: string;
}
export interface AppointmentFilter {
    status?: string;
    date?: string;
    search?: string;
    serviceId?: ServiceId;
    branchId?: BranchId;
}
export type AppointmentId = bigint;
export interface AppointmentView {
    id: AppointmentId;
    status: AppointmentStatus;
    date: string;
    createdAt: Timestamp;
    slot: string;
    reference: string;
    updatedAt: Timestamp;
    notes: string;
    serviceId: ServiceId;
    branchId: BranchId;
    checkedInAt?: Timestamp;
}
export interface AuditEntryView {
    id: AuditId;
    action: AuditAction;
    subject: string;
    createdAt: Timestamp;
    detail: string;
    actorPrincipal: Principal;
}
export type AuditId = bigint;
export interface BookingInput {
    date: string;
    slot: string;
    notes: string;
    serviceId: ServiceId;
    branchId: BranchId;
}
export type BranchId = bigint;
export interface BranchView {
    id: BranchId;
    active: boolean;
    nameAr: string;
    nameEn: string;
    nameKu: string;
    code: string;
    addressAr: string;
    addressEn: string;
    addressKu: string;
    phone: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export type CustomerId = bigint;
export interface CustomerView {
    id: CustomerId;
    verified: boolean;
    createdAt: Timestamp;
    fullName: string;
    email?: string;
    language: Language;
    nationalId: string;
    phone: string;
}
export type DeviceId = bigint;
export interface DeviceView {
    id: DeviceId;
    revoked: boolean;
    lastSeenAt: Timestamp;
    createdAt: Timestamp;
    deviceLabel: string;
}
export type Error_ = {
    __kind__: "conflict";
    conflict: string;
} | {
    __kind__: "internal";
    internal: null;
} | {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "duplicatePhone";
    duplicatePhone: null;
} | {
    __kind__: "rateLimited";
    rateLimited: null;
};
export type Error__1 = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface NotificationSettingsView {
    checkIn: boolean;
    appointmentReminder: boolean;
    appointmentConfirmed: boolean;
    appointmentRequested: boolean;
    registrationVerification: boolean;
    appointmentCancelled: boolean;
    appointmentRescheduled: boolean;
}
export interface ProfileUpdate {
    fullName?: string;
    email?: string;
    language?: Language;
}
export type QrVerification = {
    __kind__: "cancelled";
    cancelled: AppointmentDetail;
} | {
    __kind__: "valid";
    valid: AppointmentDetail;
} | {
    __kind__: "invalid";
    invalid: null;
} | {
    __kind__: "alreadyCheckedIn";
    alreadyCheckedIn: AppointmentDetail;
};
export interface RegisterInput {
    fullName: string;
    email?: string;
    language: Language;
    nationalId: string;
    phone: string;
}
export type Result = {
    __kind__: "ok";
    ok: CustomerView;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_1 = {
    __kind__: "ok";
    ok: ServiceView;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_2 = {
    __kind__: "ok";
    ok: BranchView;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_4 = {
    __kind__: "ok";
    ok: AppointmentView;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_5 = {
    __kind__: "ok";
    ok: AppointmentDetail;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_6 = {
    __kind__: "ok";
    ok: DeviceView;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error__1;
};
export interface RetentionSettingsView {
    appointmentRetentionDays: bigint;
    auditRetentionDays: bigint;
}
export type ServiceId = bigint;
export interface ServiceView {
    id: ServiceId;
    fee: bigint;
    active: boolean;
    nameAr: string;
    nameEn: string;
    nameKu: string;
    descriptionAr: string;
    descriptionEn: string;
    descriptionKu: string;
    code: string;
    requiredDocumentsAr: Array<string>;
    requiredDocumentsEn: Array<string>;
    requiredDocumentsKu: Array<string>;
}
export interface SlotAvailability {
    slot: string;
    available: boolean;
    remaining: bigint;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AppointmentStatus {
    requested = "requested",
    cancelled = "cancelled",
    rescheduled = "rescheduled",
    checkedIn = "checkedIn",
    confirmed = "confirmed"
}
export enum AuditAction {
    qrScan = "qrScan",
    checkIn = "checkIn",
    signOut = "signOut",
    registration = "registration",
    accessDenied = "accessDenied",
    roleAssigned = "roleAssigned",
    deviceRevoked = "deviceRevoked",
    bookingCreated = "bookingCreated",
    signIn = "signIn",
    qrVerified = "qrVerified",
    settingsChanged = "settingsChanged",
    statusChanged = "statusChanged",
    verification = "verification",
    bookingCancelled = "bookingCancelled",
    bookingRescheduled = "bookingRescheduled"
}
export enum Language {
    ar = "ar",
    en = "en",
    ku = "ku"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bookAppointment(input: BookingInput): Promise<Result_5>;
    cancelMyAppointment(appointmentId: AppointmentId): Promise<Result_5>;
    checkInAppointment(token: string): Promise<QrVerification>;
    completeAccountRecovery(phone: string, token: string): Promise<Result>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getAvailability(serviceId: ServiceId, branchId: BranchId, date: string): Promise<Array<SlotAvailability>>;
    getCallerUserRole(): Promise<UserRole>;
    getMyAppointment(appointmentId: AppointmentId): Promise<Result_5>;
    getMyProfile(): Promise<Result>;
    getNotificationSettings(): Promise<NotificationSettingsView>;
    getOfficeLocations(): Promise<Array<BranchView>>;
    getRetentionSettings(): Promise<RetentionSettingsView>;
    getServiceCatalogue(): Promise<Array<ServiceView>>;
    isCallerAdmin(): Promise<boolean>;
    listAllAppointments(filter: AppointmentFilter): Promise<Array<AppointmentView>>;
    listAuditLog(limit: bigint): Promise<Array<AuditEntryView>>;
    listBranches(): Promise<Array<BranchView>>;
    listMyAppointments(): Promise<Array<AppointmentView>>;
    listMyDevices(): Promise<Array<DeviceView>>;
    listServices(): Promise<Array<ServiceView>>;
    recordSignIn(): Promise<void>;
    registerCustomer(input: RegisterInput): Promise<Result>;
    registerMyDevice(deviceLabel: string): Promise<Result_6>;
    requestPhoneVerification(phone: string): Promise<Result_3>;
    rescheduleMyAppointment(appointmentId: AppointmentId, date: string, slot: string): Promise<Result_5>;
    revokeMyDevice(deviceId: DeviceId): Promise<Result_3>;
    schema(): Promise<string>;
    setAppointmentStatus(appointmentId: AppointmentId, status: AppointmentStatus): Promise<Result_4>;
    setSlotCapacity(branchId: BranchId, serviceId: ServiceId, perSlot: bigint): Promise<Result_3>;
    startAccountRecovery(phone: string): Promise<Result_3>;
    updateMyProfile(update: ProfileUpdate): Promise<Result>;
    updateNotificationSettings(settings: NotificationSettingsView): Promise<NotificationSettingsView>;
    updateRetentionSettings(settings: RetentionSettingsView): Promise<RetentionSettingsView>;
    upsertBranch(branch: BranchView): Promise<Result_2>;
    upsertService(service: ServiceView): Promise<Result_1>;
    verifyAppointmentQr(token: string): Promise<QrVerification>;
    verifyPhone(phone: string, code: string): Promise<Result>;
}
