import Debug "mo:core/Debug";

module {
  public type Timestamp = Nat;
  public type CustomerId = Nat;
  public type AppointmentId = Nat;
  public type ServiceId = Nat;
  public type BranchId = Nat;
  public type AuditId = Nat;
  public type DeviceId = Nat;

  public type Language = { #ku; #ar; #en };

  public type Error = {
    #notAuthorized;
    #notFound;
    #invalidInput : Text;
    #duplicatePhone;
    #rateLimited;
    #conflict : Text;
    #internal;
  };

  public type Result<T> = { #ok : T; #err : Error };
};
