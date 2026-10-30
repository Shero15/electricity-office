import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type OldActor = {};

  type Customer = {
    id : Nat;
    principal : Principal;
    var fullName : Text;
    phone : Text;
    nationalId : Text;
    var email : ?Text;
    var language : { #ku; #ar; #en };
    var verified : Bool;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type VerificationCode = {
    phone : Text;
    code : Text;
    var expiresAt : Nat;
    var attempts : Nat;
    var consumed : Bool;
  };

  type Device = {
    id : Nat;
    principal : Principal;
    deviceLabel : Text;
    var createdAt : Nat;
    var lastSeenAt : Nat;
    var revoked : Bool;
  };

  type RecoveryRequest = {
    phone : Text;
    var token : Text;
    var expiresAt : Nat;
    var consumed : Bool;
  };

  type CustomerState = {
    customers : Map.Map<Nat, Customer>;
    byPrincipal : Map.Map<Principal, Nat>;
    byPhone : Map.Map<Text, Nat>;
    verificationCodes : Map.Map<Text, VerificationCode>;
    devices : Map.Map<Nat, Device>;
    recoveryRequests : Map.Map<Text, RecoveryRequest>;
    var nextCustomerId : Nat;
    var nextDeviceId : Nat;
  };

  type Service = {
    id : Nat;
    code : Text;
    nameEn : Text;
    nameAr : Text;
    nameKu : Text;
    descriptionEn : Text;
    descriptionAr : Text;
    descriptionKu : Text;
    requiredDocumentsEn : [Text];
    requiredDocumentsAr : [Text];
    requiredDocumentsKu : [Text];
    fee : Nat;
    var active : Bool;
  };

  type Branch = {
    id : Nat;
    code : Text;
    nameEn : Text;
    nameAr : Text;
    nameKu : Text;
    addressEn : Text;
    addressAr : Text;
    addressKu : Text;
    phone : Text;
    var active : Bool;
  };

  type AppointmentStatus = { #requested; #confirmed; #rescheduled; #cancelled; #checkedIn };

  type Appointment = {
    id : Nat;
    reference : Text;
    customerId : Nat;
    serviceId : Nat;
    branchId : Nat;
    date : Text;
    slot : Text;
    var status : AppointmentStatus;
    var notes : Text;
    var qrToken : Text;
    var checkedInAt : ?Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type Capacity = {
    branchId : Nat;
    serviceId : Nat;
    var perSlot : Nat;
  };

  type AppointmentState = {
    services : Map.Map<Nat, Service>;
    branches : Map.Map<Nat, Branch>;
    appointments : Map.Map<Nat, Appointment>;
    byReference : Map.Map<Text, Nat>;
    byQrToken : Map.Map<Text, Nat>;
    capacities : Map.Map<Text, Capacity>;
    var nextAppointmentId : Nat;
    var nextServiceId : Nat;
    var nextBranchId : Nat;
  };

  type AuditAction = {
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

  type AuditEntry = {
    id : Nat;
    actorPrincipal : Principal;
    action : AuditAction;
    subject : Text;
    detail : Text;
    var createdAt : Nat;
  };

  type NotificationSettings = {
    var registrationVerification : Bool;
    var appointmentRequested : Bool;
    var appointmentConfirmed : Bool;
    var appointmentRescheduled : Bool;
    var appointmentCancelled : Bool;
    var appointmentReminder : Bool;
    var checkIn : Bool;
  };

  type RetentionSettings = {
    var auditRetentionDays : Nat;
    var appointmentRetentionDays : Nat;
  };

  type AdminState = {
    auditLog : List.List<AuditEntry>;
    notificationSettings : NotificationSettings;
    retentionSettings : RetentionSettings;
    var nextAuditId : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    customers : CustomerState;
    appointments : AppointmentState;
    admin : AdminState;
  };

  // The service catalogue and branch list start empty. Administrators create
  // them through `upsertService` / `upsertBranch`, so a fresh install exposes
  // no hardcoded catalogue or availability.
  func seedServices() : Map.Map<Nat, Service> {
    Map.empty();
  };

  func seedBranches() : Map.Map<Nat, Branch> {
    Map.empty();
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      customers = {
        customers = Map.empty();
        byPrincipal = Map.empty();
        byPhone = Map.empty();
        verificationCodes = Map.empty();
        devices = Map.empty();
        recoveryRequests = Map.empty();
        var nextCustomerId = 0;
        var nextDeviceId = 0;
      };
      appointments = {
        services = seedServices();
        branches = seedBranches();
        appointments = Map.empty();
        byReference = Map.empty();
        byQrToken = Map.empty();
        capacities = Map.empty();
        var nextAppointmentId = 0;
        var nextServiceId = 1;
        var nextBranchId = 1;
      };
      admin = {
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
  };
};
