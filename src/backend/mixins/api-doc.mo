mixin () {
  public query func getApiDoc() : async Text {
    "# Electricity Commercial Office — Appointment Booking API\n\n" #
    "Backend for the commercial electricity office appointment portal. It manages\n" #
    "customer registration, appointment booking with real server-side availability,\n" #
    "per-appointment QR verification, administrator check-in, and an audit log.\n\n" #
    "## Authentication and identity\n\n" #
    "Sign-in uses Internet Identity. The frontend pins an Internet Identity\n" #
    "derivation origin, published at `/.well-known/ii-derivation-origin` when\n" #
    "available; an agent already holding the user's Internet Identity authorization\n" #
    "derives the correct per-app principal against that origin (for example\n" #
    "`icp identity link web <name> --app <host>`). Such a delegation acts with the\n" #
    "user's full authority in this app until it expires.\n\n" #
    "The first signed-in caller to reach an authorization-guarded endpoint becomes\n" #
    "the administrator; every later caller is a regular user. A direct API caller\n" #
    "must sign in through the app's own frontend before any role-guarded call,\n" #
    "including guarded queries. A principal that never signed in through this app is\n" #
    "unregistered even when it belongs to the app's owner, and a signed-in caller\n" #
    "derived against a different origin is a different principal than the one the\n" #
    "frontend registered. Role reads never trap: an unregistered caller is reported\n" #
    "as `#guest` and `isCallerAdmin` returns `false`.\n\n" #
    "## Public methods\n\n" #
    "### Customer registration and profile\n\n" #
    "- `registerCustomer(input : RegisterInput) : Result<CustomerView>` — signed-in\n" #
    "  caller only. Creates the one customer record owned by the caller. The phone\n" #
    "  number is normalized to digits and must be unique. Returns `#err(#duplicatePhone)`\n" #
    "  when the phone is already registered and `#err(#conflict(...))` when the\n" #
    "  caller already owns a record.\n" #
    "- `requestPhoneVerification(phone : Text) : Result<()>` — requests a one-time\n" #
    "  verification code for a phone number. The code is delivered out-of-band and is\n" #
    "  never returned to the caller. Re-requesting while a fresh code exists returns\n" #
    "  `#err(#rateLimited)`.\n" #
    "- `verifyPhone(phone : Text, code : Text) : Result<CustomerView>` — signed-in\n" #
    "  caller only. Marks the owning customer verified. Codes expire after 10 minutes\n" #
    "  and are rejected after 5 failed attempts.\n" #
    "- `getMyProfile() : Result<CustomerView>` — query. Returns the caller's own\n" #
    "  customer record, or `#err(#notAuthorized)` when the caller has no record.\n" #
    "- `updateMyProfile(update : ProfileUpdate) : Result<CustomerView>` — signed-in\n" #
    "  caller only. Updates the caller's own name, email, and language.\n" #
    "- `listMyDevices() : [DeviceView]` — query. Lists devices bound to the caller.\n" #
    "- `registerMyDevice(deviceLabel : Text) : Result<DeviceView>` — signed-in caller\n" #
    "  only. Registers a device for the caller.\n" #
    "- `revokeMyDevice(deviceId : DeviceId) : Result<()>` — signed-in caller only.\n" #
    "  Revokes a device the caller owns.\n" #
    "- `startAccountRecovery(phone : Text) : Result<()>` — starts account recovery.\n" #
    "  Always returns `#ok(())` so it never reveals whether a phone is registered.\n" #
    "- `completeAccountRecovery(phone : Text, token : Text) : Result<CustomerView>` —\n" #
    "  signed-in caller only. Rebinds the account to the recovering principal and\n" #
    "  revokes the account's other devices. Recovery tokens expire after 15 minutes.\n\n" #
    "### Service catalogue and booking\n\n" #
    "- `getServiceCatalogue() : [ServiceView]` — query. Public service catalogue with\n" #
    "  names, descriptions, required documents, and fees in all three languages. The\n" #
    "  catalogue starts empty on a fresh install; administrators populate it with\n" #
    "  `upsertService`.\n" #
    "- `getOfficeLocations() : [BranchView]` — query. Public office locations with\n" #
    "  addresses and phone numbers. Starts empty on a fresh install; administrators\n" #
    "  populate it with `upsertBranch`.\n" #
    "- `listServices() : [ServiceView]` — query. Same catalogue as `getServiceCatalogue`.\n" #
    "- `listBranches() : [BranchView]` — query. Same locations as `getOfficeLocations`.\n" #
    "- `getAvailability(serviceId, branchId, date) : [SlotAvailability]` — query.\n" #
    "  Real server-side availability for a fixed daily slot grid, derived from\n" #
    "  per-(branch, service) capacity and existing bookings. `date` is a text date\n" #
    "  (for example `2026-10-19`); `slot` values are `HH:MM` text.\n" #
    "- `bookAppointment(input : BookingInput) : Result<AppointmentDetail>` — signed-in\n" #
    "  caller only. A caller with no customer record is provisioned a minimal one on\n" #
    "  first booking. Rejects a slot that is already full with\n" #
    "  `#err(#conflict(...))`. The returned detail carries the appointment's QR token.\n" #
    "- `listMyAppointments() : [AppointmentView]` — query. The caller's own\n" #
    "  appointments, newest first, with status `requested`, `confirmed`,\n" #
    "  `rescheduled`, `cancelled`, or `checkedIn`.\n" #
    "- `getMyAppointment(appointmentId) : Result<AppointmentDetail>` — query. The\n" #
    "  caller's own appointment detail, including its QR token.\n" #
    "- `rescheduleMyAppointment(appointmentId, date, slot) : Result<AppointmentDetail>`\n" #
    "  — signed-in caller only. Cancelled and checked-in appointments cannot be\n" #
    "  rescheduled.\n" #
    "- `cancelMyAppointment(appointmentId) : Result<AppointmentDetail>` — signed-in\n" #
    "  caller only. Cancelled and checked-in appointments cannot be cancelled.\n\n" #
    "### Administrator methods\n\n" #
    "Every administrator method is enforced server-side. A non-administrator caller\n" #
    "is denied and the denial is recorded in the audit log.\n\n" #
    "- `verifyAppointmentQr(token : Text) : QrVerification` — verifies a scanned QR\n" #
    "  token. Returns `#valid(detail)`, `#alreadyCheckedIn(detail)`,\n" #
    "  `#cancelled(detail)`, or `#invalid`. A non-administrator receives `#invalid`.\n" #
    "- `checkInAppointment(token : Text) : QrVerification` — confirms the customer's\n" #
    "  arrival. A repeated scan returns `#alreadyCheckedIn(detail)` instead of\n" #
    "  checking in twice. A non-administrator receives `#invalid`.\n" #
    "- `listAllAppointments(filter : AppointmentFilter) : [AppointmentView]` — query.\n" #
    "  Filterable appointment table. A non-administrator receives an empty list.\n" #
    "- `setAppointmentStatus(appointmentId, status) : Result<AppointmentView>` —\n" #
    "  changes an appointment's status.\n" #
    "- `listAuditLog(limit : Nat) : [AuditEntryView]` — query. Most recent audit\n" #
    "  entries, newest first. A non-administrator receives an empty list.\n" #
    "- `getNotificationSettings() : NotificationSettingsView` — query.\n" #
    "- `updateNotificationSettings(settings) : NotificationSettingsView`.\n" #
    "- `getRetentionSettings() : RetentionSettingsView` — query.\n" #
    "- `updateRetentionSettings(settings) : RetentionSettingsView`.\n" #
    "- `upsertService(service : ServiceView) : Result<ServiceView>` — creates a\n" #
    "  service when `id` is `0`, otherwise updates it.\n" #
    "- `upsertBranch(branch : BranchView) : Result<BranchView>` — creates a branch\n" #
    "  when `id` is `0`, otherwise updates it.\n" #
    "- `setSlotCapacity(branchId, serviceId, perSlot) : Result<()>` — sets the\n" #
    "  per-slot booking capacity. Capacity must be at least 1.\n\n" #
    "## Units and encodings\n\n" #
    "- Timestamps are nanoseconds since the Unix epoch, as `Nat`.\n" #
    "- Identifiers (`CustomerId`, `AppointmentId`, `ServiceId`, `BranchId`,\n" #
    "  `DeviceId`, `AuditId`) are `Nat`.\n" #
    "- `date` is a text date; `slot` is `HH:MM` text.\n" #
    "- `Language` is `#ku` (Kurdish Sorani), `#ar` (Arabic), or `#en` (English).\n" #
    "- Optional values are Candid `opt`; absent means `null`.\n" #
    "- `Result<T>` is `{ #ok : T; #err : Error }` with error tags `#notAuthorized`,\n" #
    "  `#notFound`, `#invalidInput(Text)`, `#duplicatePhone`, `#rateLimited`,\n" #
    "  `#conflict(Text)`, and `#internal`.\n\n" #
    "## Lifecycle and polling\n\n" #
    "An appointment starts as `requested`, moves to `confirmed` or `rescheduled`,\n" #
    "and ends as `cancelled` or `checkedIn`. `checkedInAt` is set only on check-in.\n" #
    "Poll `listMyAppointments` or `getMyAppointment` for status changes; there is no\n" #
    "push channel.\n\n" #
    "## Mutation retry safety\n\n" #
    "`bookAppointment` is not idempotent: a retried call creates a second\n" #
    "appointment. `checkInAppointment` is idempotent — a repeated scan returns the\n" #
    "existing check-in status. `cancelMyAppointment` and `rescheduleMyAppointment`\n" #
    "reject an already-cancelled appointment. `registerCustomer` is idempotent per\n" #
    "caller: a second call returns `#err(#conflict(...))`.\n\n" #
    "## Errors, traps, and limits\n\n" #
    "Authorization failures on administrator methods return empty or `#invalid`\n" #
    "results rather than traps. Verification codes expire after 10 minutes with a\n" #
    "5-attempt limit and a 60-second resend cooldown. Recovery tokens expire after\n" #
    "15 minutes. The audit log retains the most recent 5000 entries.\n";
  };
};
