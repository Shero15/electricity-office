import AccessControl "mo:caffeineai-authorization/access-control";
import Principal "mo:core/Principal";
import AuthLib "../lib/auth";
import AdminLib "../lib/admin";
import AppointmentLib "../lib/appointment";
import CustomerLib "../lib/customer";
import AppointmentTypes "../types/appointment";
import AdminTypes "../types/admin";
import Common "../types/common";

mixin (accessControlState : AccessControl.AccessControlState, admin : AdminLib.State, appointments : AppointmentLib.State, customers : CustomerLib.State) {
  // Stable text form of an appointment status, used for filtering and audit
  // detail.
  func statusToText(status : AppointmentTypes.AppointmentStatus) : Text {
    switch (status) {
      case (#requested) { "requested" };
      case (#confirmed) { "confirmed" };
      case (#rescheduled) { "rescheduled" };
      case (#cancelled) { "cancelled" };
      case (#checkedIn) { "checkedin" };
    };
  };

  // Server-side admin gate. Every privileged action calls this first; a
  // non-admin caller is denied and the denial is recorded in the audit log.
  // The caller is registered on first use so the check never traps for an
  // unregistered principal.
  func requireAdmin(caller : Principal, action : Text) : Bool {
    if (AuthLib.isAdminEnsuring(accessControlState, caller)) {
      return true;
    };
    AdminLib.record(admin, caller, #accessDenied, action, "Caller is not an administrator.");
    false;
  };

  // Record a successful sign-in for the calling principal. Called by the
  // frontend after authentication; the caller is always the signed-in user.
  public shared ({ caller }) func recordSignIn() : async () {
    AdminLib.record(admin, caller, #signIn, caller.toText(), "User signed in.");
  };

  // The notification email address for the customer owning an appointment.
  func emailForAppointment(appointmentId : Common.AppointmentId) : ?Text {
    switch (AppointmentLib.customerIdOf(appointments, appointmentId)) {
      case (?customerId) { CustomerLib.emailFor(customers, customerId) };
      case null { null };
    };
  };

  // Verify a scanned QR token and return the authorized appointment detail.
  public shared ({ caller }) func verifyAppointmentQr(token : Text) : async AppointmentTypes.QrVerification {
    if (not requireAdmin(caller, "verifyAppointmentQr")) {
      return #invalid;
    };
    AdminLib.record(admin, caller, #qrScan, token, "QR token scanned for verification.");
    let result = AppointmentLib.verifyQr(appointments, token);
    switch (result) {
      case (#valid(detail)) {
        AdminLib.record(admin, caller, #qrVerified, detail.appointment.reference, "QR token verified.");
      };
      case (#alreadyCheckedIn(detail)) {
        AdminLib.record(admin, caller, #qrVerified, detail.appointment.reference, "QR token verified; already checked in.");
      };
      case (#cancelled(detail)) {
        AdminLib.record(admin, caller, #qrVerified, detail.appointment.reference, "QR token verified; appointment cancelled.");
      };
      case (#invalid) {
        AdminLib.record(admin, caller, #qrVerified, token, "QR token rejected as invalid.");
      };
    };
    result;
  };

  // Confirm the customer's arrival. A repeated scan returns the existing
  // check-in status instead of checking in twice.
  public shared ({ caller }) func checkInAppointment(token : Text) : async AppointmentTypes.QrVerification {
    if (not requireAdmin(caller, "checkInAppointment")) {
      return #invalid;
    };
    let result = AppointmentLib.checkIn(appointments, token);
    switch (result) {
      case (#valid(detail)) {
        AdminLib.record(admin, caller, #checkIn, detail.appointment.reference, "Customer checked in.");
        switch (emailForAppointment(detail.appointment.id)) {
          case (?email) {
            await AdminLib.notify(
              admin,
              #checkIn,
              email,
              "Check-in confirmed",
              "Your arrival for appointment " # detail.appointment.reference # " has been confirmed.",
            );
          };
          case null {};
        };
      };
      case (#alreadyCheckedIn(detail)) {
        AdminLib.record(admin, caller, #checkIn, detail.appointment.reference, "Repeat scan; already checked in.");
      };
      case (#cancelled(detail)) {
        AdminLib.record(admin, caller, #checkIn, detail.appointment.reference, "Check-in rejected; appointment cancelled.");
      };
      case (#invalid) {
        AdminLib.record(admin, caller, #checkIn, token, "Check-in rejected; invalid QR token.");
      };
    };
    result;
  };

  // Searchable/filterable appointment table for administrators.
  public query ({ caller }) func listAllAppointments(filter : AdminTypes.AppointmentFilter) : async [AppointmentTypes.AppointmentView] {
    if (not AuthLib.isAdminSafe(accessControlState, caller)) {
      return [];
    };
    let all = AppointmentLib.listAll(appointments);
    let statusFilter = filter.status;
    let serviceFilter = filter.serviceId;
    let branchFilter = filter.branchId;
    let dateFilter = filter.date;
    let searchFilter = filter.search;
    all.filter(
      func(view) {
        let statusOk = switch (statusFilter) {
          case (?s) { statusToText(view.status) == s.toLower() };
          case null { true };
        };
        let serviceOk = switch (serviceFilter) {
          case (?id) { view.serviceId == id };
          case null { true };
        };
        let branchOk = switch (branchFilter) {
          case (?id) { view.branchId == id };
          case null { true };
        };
        let dateOk = switch (dateFilter) {
          case (?d) { view.date == d };
          case null { true };
        };
        let searchOk = switch (searchFilter) {
          case (?q) {
            let term = q.trim(#char ' ').toLower();
            if (term.size() == 0) {
              true;
            } else {
              view.reference.toLower().contains(#text term) or view.slot.toLower().contains(#text term);
            };
          };
          case null { true };
        };
        statusOk and serviceOk and branchOk and dateOk and searchOk;
      }
    );
  };

  // Change an appointment's status from the admin dashboard.
  public shared ({ caller }) func setAppointmentStatus(appointmentId : Common.AppointmentId, status : AppointmentTypes.AppointmentStatus) : async Common.Result<AppointmentTypes.AppointmentView> {
    if (not requireAdmin(caller, "setAppointmentStatus")) {
      return #err(#notAuthorized);
    };
    let result = AppointmentLib.setStatus(appointments, appointmentId, status);
    switch (result) {
      case (#ok(view)) {
        AdminLib.record(admin, caller, #statusChanged, view.reference, "Status set to " # statusToText(status) # ".");
        switch (status) {
          case (#confirmed) {
            switch (emailForAppointment(appointmentId)) {
              case (?email) {
                await AdminLib.notify(
                  admin,
                  #appointmentConfirmed,
                  email,
                  "Appointment confirmed",
                  "Your appointment " # view.reference # " on " # view.date # " at " # view.slot # " has been confirmed.",
                );
              };
              case null {};
            };
          };
          case (_) {};
        };
      };
      case (#err(_)) {};
    };
    result;
  };

  public query ({ caller }) func listAuditLog(limit : Nat) : async [AdminTypes.AuditEntryView] {
    if (not AuthLib.isAdminSafe(accessControlState, caller)) {
      return [];
    };
    AdminLib.listAudit(admin, limit);
  };

  public query ({ caller }) func getNotificationSettings() : async AdminTypes.NotificationSettingsView {
    if (not AuthLib.isAdminSafe(accessControlState, caller)) {
      return {
        registrationVerification = false;
        appointmentRequested = false;
        appointmentConfirmed = false;
        appointmentRescheduled = false;
        appointmentCancelled = false;
        appointmentReminder = false;
        checkIn = false;
      };
    };
    AdminLib.getNotificationSettings(admin);
  };

  public shared ({ caller }) func updateNotificationSettings(settings : AdminTypes.NotificationSettingsView) : async AdminTypes.NotificationSettingsView {
    if (not requireAdmin(caller, "updateNotificationSettings")) {
      return AdminLib.getNotificationSettings(admin);
    };
    let updated = AdminLib.updateNotificationSettings(admin, settings);
    AdminLib.record(admin, caller, #settingsChanged, "notifications", "Notification preferences updated.");
    updated;
  };

  public query ({ caller }) func getRetentionSettings() : async AdminTypes.RetentionSettingsView {
    if (not AuthLib.isAdminSafe(accessControlState, caller)) {
      return { auditRetentionDays = 0; appointmentRetentionDays = 0 };
    };
    AdminLib.getRetentionSettings(admin);
  };

  public shared ({ caller }) func updateRetentionSettings(settings : AdminTypes.RetentionSettingsView) : async AdminTypes.RetentionSettingsView {
    if (not requireAdmin(caller, "updateRetentionSettings")) {
      return AdminLib.getRetentionSettings(admin);
    };
    let updated = AdminLib.updateRetentionSettings(admin, settings);
    AdminLib.record(admin, caller, #settingsChanged, "retention", "Retention settings updated.");
    updated;
  };

  public shared ({ caller }) func upsertService(service : AppointmentTypes.ServiceView) : async Common.Result<AppointmentTypes.ServiceView> {
    if (not requireAdmin(caller, "upsertService")) {
      return #err(#notAuthorized);
    };
    let result = AppointmentLib.upsertService(appointments, service);
    switch (result) {
      case (#ok(view)) {
        AdminLib.record(admin, caller, #settingsChanged, view.code, "Service upserted.");
      };
      case (#err(_)) {};
    };
    result;
  };

  public shared ({ caller }) func upsertBranch(branch : AppointmentTypes.BranchView) : async Common.Result<AppointmentTypes.BranchView> {
    if (not requireAdmin(caller, "upsertBranch")) {
      return #err(#notAuthorized);
    };
    let result = AppointmentLib.upsertBranch(appointments, branch);
    switch (result) {
      case (#ok(view)) {
        AdminLib.record(admin, caller, #settingsChanged, view.code, "Branch upserted.");
      };
      case (#err(_)) {};
    };
    result;
  };

  public shared ({ caller }) func setSlotCapacity(branchId : Common.BranchId, serviceId : Common.ServiceId, perSlot : Nat) : async Common.Result<()> {
    if (not requireAdmin(caller, "setSlotCapacity")) {
      return #err(#notAuthorized);
    };
    let result = AppointmentLib.setCapacity(appointments, branchId, serviceId, perSlot);
    switch (result) {
      case (#ok(_)) {
        AdminLib.record(admin, caller, #settingsChanged, "capacity", "Slot capacity updated.");
      };
      case (#err(_)) {};
    };
    result;
  };
};
