import Common "common";

module {
  public type AuditId = Common.AuditId;
  public type Timestamp = Common.Timestamp;

  public type AuditAction = {
    #signIn;
    #signOut;
    #registration;
    #verification;
    #bookingCreated;
    #bookingRescheduled;
    #bookingCancelled;
    #statusChanged;
    #qrScan;
    #qrVerified;
    #checkIn;
    #accessDenied;
    #roleAssigned;
    #deviceRevoked;
    #settingsChanged;
  };

  public type AuditEntry = {
    id : AuditId;
    actorPrincipal : Principal;
    action : AuditAction;
    subject : Text;
    detail : Text;
    var createdAt : Timestamp;
  };

  public type AuditEntryView = {
    id : AuditId;
    actorPrincipal : Principal;
    action : AuditAction;
    subject : Text;
    detail : Text;
    createdAt : Timestamp;
  };

  public type NotificationKind = {
    #registrationVerification;
    #appointmentRequested;
    #appointmentConfirmed;
    #appointmentRescheduled;
    #appointmentCancelled;
    #appointmentReminder;
    #checkIn;
  };

  public type NotificationSettings = {
    var registrationVerification : Bool;
    var appointmentRequested : Bool;
    var appointmentConfirmed : Bool;
    var appointmentRescheduled : Bool;
    var appointmentCancelled : Bool;
    var appointmentReminder : Bool;
    var checkIn : Bool;
  };

  public type NotificationSettingsView = {
    registrationVerification : Bool;
    appointmentRequested : Bool;
    appointmentConfirmed : Bool;
    appointmentRescheduled : Bool;
    appointmentCancelled : Bool;
    appointmentReminder : Bool;
    checkIn : Bool;
  };

  public type RetentionSettings = {
    var auditRetentionDays : Nat;
    var appointmentRetentionDays : Nat;
  };

  public type RetentionSettingsView = {
    auditRetentionDays : Nat;
    appointmentRetentionDays : Nat;
  };

  public type AppointmentFilter = {
    status : ?Text;
    serviceId : ?Common.ServiceId;
    branchId : ?Common.BranchId;
    date : ?Text;
    search : ?Text;
  };
};
