import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import EmailClient "mo:caffeineai-email/emailClient";
import Types "../types/admin";
import Common "../types/common";

module {
  public type State = {
    auditLog : List.List<Types.AuditEntry>;
    notificationSettings : Types.NotificationSettings;
    retentionSettings : Types.RetentionSettings;
    var nextAuditId : Nat;
  };

  // Maximum number of audit entries retained in memory. Older entries are
  // trimmed so the log cannot grow without bound.
  let AUDIT_LOG_LIMIT : Nat = 5000;

  public func initState() : State {
    {
      auditLog = List.empty();
      notificationSettings = {
        var registrationVerification = true;
        var appointmentRequested = true;
        var appointmentConfirmed = true;
        var appointmentRescheduled = true;
        var appointmentCancelled = true;
        var appointmentReminder = true;
        var checkIn = true;
      };
      retentionSettings = {
        var auditRetentionDays = 365;
        var appointmentRetentionDays = 1825;
      };
      var nextAuditId = 0;
    };
  };

  func toAuditView(entry : Types.AuditEntry) : Types.AuditEntryView {
    {
      id = entry.id;
      actorPrincipal = entry.actorPrincipal;
      action = entry.action;
      subject = entry.subject;
      detail = entry.detail;
      createdAt = entry.createdAt;
    };
  };

  // Append an audit entry. The log is append-only and bounded; when the limit
  // is reached the oldest entries are dropped.
  public func record(state : State, caller : Principal, action : Types.AuditAction, subject : Text, detail : Text) : () {
    let id = state.nextAuditId;
    state.nextAuditId := id + 1;
    let entry : Types.AuditEntry = {
      id;
      actorPrincipal = caller;
      action;
      subject;
      detail;
      var createdAt = Int.abs(Time.now());
    };
    state.auditLog.add(entry);
    if (state.auditLog.size() > AUDIT_LOG_LIMIT) {
      // Drop the oldest entry (index 0) by rebuilding from the tail.
      let snapshot = state.auditLog.toArray();
      state.auditLog.clear();
      var i = 1;
      while (i < snapshot.size()) {
        state.auditLog.add(snapshot[i]);
        i += 1;
      };
    };
  };

  // Return the most recent audit entries, newest first, capped at `limit`.
  public func listAudit(state : State, limit : Nat) : [Types.AuditEntryView] {
    let snapshot = state.auditLog.toArray();
    let total = snapshot.size();
    let take = if (limit == 0 or limit > total) { total } else { limit };
    let result = List.empty<Types.AuditEntryView>();
    var i = 0;
    while (i < take) {
      // Walk backwards from the end so the newest entry comes first.
      result.add(toAuditView(snapshot[total - 1 - i]));
      i += 1;
    };
    result.toArray();
  };

  public func getNotificationSettings(state : State) : Types.NotificationSettingsView {
    let s = state.notificationSettings;
    {
      registrationVerification = s.registrationVerification;
      appointmentRequested = s.appointmentRequested;
      appointmentConfirmed = s.appointmentConfirmed;
      appointmentRescheduled = s.appointmentRescheduled;
      appointmentCancelled = s.appointmentCancelled;
      appointmentReminder = s.appointmentReminder;
      checkIn = s.checkIn;
    };
  };

  public func updateNotificationSettings(state : State, view : Types.NotificationSettingsView) : Types.NotificationSettingsView {
    let s = state.notificationSettings;
    s.registrationVerification := view.registrationVerification;
    s.appointmentRequested := view.appointmentRequested;
    s.appointmentConfirmed := view.appointmentConfirmed;
    s.appointmentRescheduled := view.appointmentRescheduled;
    s.appointmentCancelled := view.appointmentCancelled;
    s.appointmentReminder := view.appointmentReminder;
    s.checkIn := view.checkIn;
    getNotificationSettings(state);
  };

  public func getRetentionSettings(state : State) : Types.RetentionSettingsView {
    let s = state.retentionSettings;
    {
      auditRetentionDays = s.auditRetentionDays;
      appointmentRetentionDays = s.appointmentRetentionDays;
    };
  };

  public func updateRetentionSettings(state : State, view : Types.RetentionSettingsView) : Types.RetentionSettingsView {
    let s = state.retentionSettings;
    s.auditRetentionDays := view.auditRetentionDays;
    s.appointmentRetentionDays := view.appointmentRetentionDays;
    getRetentionSettings(state);
  };

  // Whether a notification kind is currently enabled by the administrator.
  func isEnabled(state : State, kind : Types.NotificationKind) : Bool {
    let s = state.notificationSettings;
    switch (kind) {
      case (#registrationVerification) { s.registrationVerification };
      case (#appointmentRequested) { s.appointmentRequested };
      case (#appointmentConfirmed) { s.appointmentConfirmed };
      case (#appointmentRescheduled) { s.appointmentRescheduled };
      case (#appointmentCancelled) { s.appointmentCancelled };
      case (#appointmentReminder) { s.appointmentReminder };
      case (#checkIn) { s.checkIn };
    };
  };

  // Send a transactional notification email when the kind is enabled and a
  // recipient address is available. Failures are swallowed so a mail outage
  // never rolls back the business action that triggered the notification.
  public func notify(state : State, kind : Types.NotificationKind, recipient : Text, subject : Text, body : Text) : async () {
    if (not isEnabled(state, kind)) {
      return;
    };
    if (recipient.size() == 0) {
      return;
    };
    ignore await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
  };
};
