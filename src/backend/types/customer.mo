import Debug "mo:core/Debug";
import Common "common";

module {
  public type CustomerId = Common.CustomerId;
  public type DeviceId = Common.DeviceId;
  public type Timestamp = Common.Timestamp;
  public type Language = Common.Language;

  public type Customer = {
    id : CustomerId;
    principal : Principal;
    var fullName : Text;
    phone : Text;
    nationalId : Text;
    var email : ?Text;
    var language : Language;
    var verified : Bool;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  public type CustomerView = {
    id : CustomerId;
    fullName : Text;
    phone : Text;
    nationalId : Text;
    email : ?Text;
    language : Language;
    verified : Bool;
    createdAt : Timestamp;
  };

  public type RegisterInput = {
    fullName : Text;
    phone : Text;
    nationalId : Text;
    email : ?Text;
    language : Language;
  };

  public type ProfileUpdate = {
    fullName : ?Text;
    email : ?Text;
    language : ?Language;
  };

  public type VerificationCode = {
    phone : Text;
    code : Text;
    var expiresAt : Timestamp;
    var attempts : Nat;
    var consumed : Bool;
  };

  public type Device = {
    id : DeviceId;
    principal : Principal;
    deviceLabel : Text;
    var createdAt : Timestamp;
    var lastSeenAt : Timestamp;
    var revoked : Bool;
  };

  public type DeviceView = {
    id : DeviceId;
    deviceLabel : Text;
    createdAt : Timestamp;
    lastSeenAt : Timestamp;
    revoked : Bool;
  };

  public type RecoveryRequest = {
    phone : Text;
    var token : Text;
    var expiresAt : Timestamp;
    var consumed : Bool;
  };
};
