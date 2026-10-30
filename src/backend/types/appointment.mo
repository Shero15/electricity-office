import Debug "mo:core/Debug";
import Common "common";

module {
  public type AppointmentId = Common.AppointmentId;
  public type ServiceId = Common.ServiceId;
  public type BranchId = Common.BranchId;
  public type CustomerId = Common.CustomerId;
  public type Timestamp = Common.Timestamp;
  public type Language = Common.Language;

  public type Service = {
    id : ServiceId;
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

  public type ServiceView = {
    id : ServiceId;
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
    active : Bool;
  };

  public type Branch = {
    id : BranchId;
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

  public type BranchView = {
    id : BranchId;
    code : Text;
    nameEn : Text;
    nameAr : Text;
    nameKu : Text;
    addressEn : Text;
    addressAr : Text;
    addressKu : Text;
    phone : Text;
    active : Bool;
  };

  public type AppointmentStatus = {
    #requested;
    #confirmed;
    #rescheduled;
    #cancelled;
    #checkedIn;
  };

  public type Appointment = {
    id : AppointmentId;
    reference : Text;
    customerId : CustomerId;
    serviceId : ServiceId;
    branchId : BranchId;
    date : Text;
    slot : Text;
    var status : AppointmentStatus;
    var notes : Text;
    var qrToken : Text;
    var checkedInAt : ?Timestamp;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  public type AppointmentView = {
    id : AppointmentId;
    reference : Text;
    serviceId : ServiceId;
    branchId : BranchId;
    date : Text;
    slot : Text;
    status : AppointmentStatus;
    notes : Text;
    checkedInAt : ?Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type AppointmentDetail = {
    appointment : AppointmentView;
    service : ?ServiceView;
    branch : ?BranchView;
    qrToken : Text;
  };

  public type BookingInput = {
    serviceId : ServiceId;
    branchId : BranchId;
    date : Text;
    slot : Text;
    notes : Text;
  };

  public type SlotAvailability = {
    slot : Text;
    available : Bool;
    remaining : Nat;
  };

  public type Capacity = {
    branchId : BranchId;
    serviceId : ServiceId;
    var perSlot : Nat;
  };

  public type QrVerification = {
    #valid : AppointmentDetail;
    #alreadyCheckedIn : AppointmentDetail;
    #cancelled : AppointmentDetail;
    #invalid;
  };
};
