import CustomerLib "../lib/customer";
import AdminLib "../lib/admin";
import CustomerTypes "../types/customer";
import Common "../types/common";

mixin (state : CustomerLib.State, admin : AdminLib.State) {
  public shared ({ caller }) func registerCustomer(input : CustomerTypes.RegisterInput) : async Common.Result<CustomerTypes.CustomerView> {
    let result = CustomerLib.register(state, caller, input);
    switch (result) {
      case (#ok(view)) {
        AdminLib.record(admin, caller, #registration, view.phone, "Customer registered.");
        switch (view.email) {
          case (?email) {
            await AdminLib.notify(
              admin,
              #registrationVerification,
              email,
              "Registration received",
              "Your registration has been received. Please verify your phone number to activate your account.",
            );
          };
          case null {};
        };
      };
      case (#err(_)) {};
    };
    result;
  };

  public shared func requestPhoneVerification(phone : Text) : async Common.Result<()> {
    await CustomerLib.requestVerificationCode(state, phone);
  };

  public shared ({ caller }) func verifyPhone(phone : Text, code : Text) : async Common.Result<CustomerTypes.CustomerView> {
    let result = CustomerLib.verifyCode(state, caller, phone, code);
    switch (result) {
      case (#ok(view)) {
        AdminLib.record(admin, caller, #verification, view.phone, "Phone number verified.");
      };
      case (#err(_)) {};
    };
    result;
  };

  public query ({ caller }) func getMyProfile() : async Common.Result<CustomerTypes.CustomerView> {
    CustomerLib.getView(state, caller);
  };

  public shared ({ caller }) func updateMyProfile(update : CustomerTypes.ProfileUpdate) : async Common.Result<CustomerTypes.CustomerView> {
    CustomerLib.updateProfile(state, caller, update);
  };

  public query ({ caller }) func listMyDevices() : async [CustomerTypes.DeviceView] {
    CustomerLib.listDevices(state, caller);
  };

  public shared ({ caller }) func registerMyDevice(deviceLabel : Text) : async Common.Result<CustomerTypes.DeviceView> {
    CustomerLib.registerDevice(state, caller, deviceLabel);
  };

  public shared ({ caller }) func revokeMyDevice(deviceId : Common.DeviceId) : async Common.Result<()> {
    let result = CustomerLib.revokeDevice(state, caller, deviceId);
    switch (result) {
      case (#ok(_)) {
        AdminLib.record(admin, caller, #deviceRevoked, deviceId.toText(), "Device revoked.");
      };
      case (#err(_)) {};
    };
    result;
  };

  public shared func startAccountRecovery(phone : Text) : async Common.Result<()> {
    await CustomerLib.startRecovery(state, phone);
  };

  public shared ({ caller }) func completeAccountRecovery(phone : Text, token : Text) : async Common.Result<CustomerTypes.CustomerView> {
    CustomerLib.completeRecovery(state, caller, phone, token);
  };
};
