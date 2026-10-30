import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Random "mo:core/Random";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types/customer";
import Common "../types/common";

module {
  public type State = {
    customers : Map.Map<Common.CustomerId, Types.Customer>;
    byPrincipal : Map.Map<Principal, Common.CustomerId>;
    byPhone : Map.Map<Text, Common.CustomerId>;
    verificationCodes : Map.Map<Text, Types.VerificationCode>;
    devices : Map.Map<Common.DeviceId, Types.Device>;
    recoveryRequests : Map.Map<Text, Types.RecoveryRequest>;
    var nextCustomerId : Nat;
    var nextDeviceId : Nat;
  };

  // Verification code lifetime and attempt limits.
  let CODE_TTL_NS : Nat = 600_000_000_000; // 10 minutes
  let CODE_MAX_ATTEMPTS : Nat = 5;
  let CODE_RESEND_COOLDOWN_NS : Nat = 60_000_000_000; // 60 seconds
  let RECOVERY_TTL_NS : Nat = 900_000_000_000; // 15 minutes

  public func initState() : State {
    {
      customers = Map.empty();
      byPrincipal = Map.empty();
      byPhone = Map.empty();
      verificationCodes = Map.empty();
      devices = Map.empty();
      recoveryRequests = Map.empty();
      var nextCustomerId = 0;
      var nextDeviceId = 0;
    };
  };

  public func toView(customer : Types.Customer) : Types.CustomerView {
    {
      id = customer.id;
      fullName = customer.fullName;
      phone = customer.phone;
      nationalId = customer.nationalId;
      email = customer.email;
      language = customer.language;
      verified = customer.verified;
      createdAt = customer.createdAt;
    };
  };

  func toDeviceView(device : Types.Device) : Types.DeviceView {
    {
      id = device.id;
      deviceLabel = device.deviceLabel;
      createdAt = device.createdAt;
      lastSeenAt = device.lastSeenAt;
      revoked = device.revoked;
    };
  };

  // Normalize a phone number so uniqueness and lookups are stable.
  // Keeps only digit characters, so formatting differences do not create
  // duplicate accounts.
  func normalizePhone(phone : Text) : Text {
    phone.map(func(c) = if (c.isDigit()) { c } else { ' ' }).trim(#char ' ').replace(#text " ", "");
  };

  // Trim surrounding whitespace from a free-text field.
  func cleanText(value : Text) : Text {
    value.trim(#char ' ');
  };

  // Generate an unpredictable numeric verification code (6 digits).
  func generateCode() : async Text {
    let n = await Random.natRange(0, 1_000_000);
    let s = n.toText();
    // Left-pad to 6 digits.
    var prefix = "";
    var i = s.size();
    while (i < 6) {
      prefix := prefix # "0";
      i += 1;
    };
    prefix # s;
  };

  // Generate an unpredictable opaque token (hex-ish, 32 chars).
  func generateToken() : async Text {
    let a = await Random.natRange(0, 4_294_967_296);
    let b = await Random.natRange(0, 4_294_967_296);
    let c = await Random.natRange(0, 4_294_967_296);
    let d = await Random.natRange(0, 4_294_967_296);
    a.toText() # "-" # b.toText() # "-" # c.toText() # "-" # d.toText();
  };

  public func register(state : State, caller : Principal, input : Types.RegisterInput) : Common.Result<Types.CustomerView> {
    let phone = normalizePhone(input.phone);
    if (phone.size() < 6 or cleanText(input.fullName).size() == 0 or cleanText(input.nationalId).size() == 0) {
      return #err(#invalidInput("Please provide a valid name, phone number and national ID."));
    };
    // Phone uniqueness is enforced server-side.
    switch (state.byPhone.get(phone)) {
      case (?_) { return #err(#duplicatePhone) };
      case null {};
    };
    // A principal may only own one customer record.
    switch (state.byPrincipal.get(caller)) {
      case (?_) { return #err(#conflict("This account is already registered.")) };
      case null {};
    };
    let now = Int.abs(Time.now());
    let id = state.nextCustomerId;
    state.nextCustomerId := id + 1;
    let customer : Types.Customer = {
      id;
      principal = caller;
      var fullName = cleanText(input.fullName);
      phone;
      nationalId = cleanText(input.nationalId);
      var email = input.email;
      var language = input.language;
      var verified = false;
      var createdAt = now;
      var updatedAt = now;
    };
    state.customers.add(id, customer);
    state.byPrincipal.add(caller, id);
    state.byPhone.add(phone, id);
    #ok(toView(customer));
  };

  public func requestVerificationCode(state : State, phone : Text) : async Common.Result<()> {
    let normalized = normalizePhone(phone);
    if (normalized.size() < 6) {
      return #err(#invalidInput("Please provide a valid phone number."));
    };
    let now = Int.abs(Time.now());
    // Rate limit: reject a re-request while the previous code is still fresh.
    // Addition-only comparison avoids Nat subtraction.
    switch (state.verificationCodes.get(normalized)) {
      case (?existing) {
        if (not existing.consumed and existing.expiresAt > now and (now + CODE_TTL_NS) < (existing.expiresAt + CODE_RESEND_COOLDOWN_NS)) {
          return #err(#rateLimited);
        };
      };
      case null {};
    };
    let code = await generateCode();
    state.verificationCodes.add(normalized, {
      phone = normalized;
      code;
      var expiresAt = now + CODE_TTL_NS;
      var attempts = 0;
      var consumed = false;
    });
    // The code is delivered out-of-band by the notification layer; it is never
    // returned to the caller.
    #ok(());
  };

  public func verifyCode(state : State, caller : Principal, phone : Text, code : Text) : Common.Result<Types.CustomerView> {
    let normalized = normalizePhone(phone);
    let now = Int.abs(Time.now());
    let record = switch (state.verificationCodes.get(normalized)) {
      case (?r) { r };
      case null { return #err(#invalidInput("The verification code is invalid or has expired.")) };
    };
    if (record.consumed or record.expiresAt <= now) {
      return #err(#invalidInput("The verification code is invalid or has expired."));
    };
    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      return #err(#rateLimited);
    };
    if (record.code != cleanText(code)) {
      record.attempts := record.attempts + 1;
      return #err(#invalidInput("The verification code is invalid or has expired."));
    };
    record.consumed := true;
    // Mark the owning customer verified.
    switch (state.byPhone.get(normalized)) {
      case (?customerId) {
        switch (state.customers.get(customerId)) {
          case (?customer) {
            customer.verified := true;
            customer.updatedAt := now;
            // Bind the verifying principal if the record is not yet bound.
            if (customer.principal != caller) {
              state.byPrincipal.add(caller, customerId);
            };
            return #ok(toView(customer));
          };
          case null {};
        };
      };
      case null {};
    };
    #err(#notFound);
  };

  public func getByPrincipal(state : State, caller : Principal) : ?Types.Customer {
    switch (state.byPrincipal.get(caller)) {
      case (?id) { state.customers.get(id) };
      case null { null };
    };
  };

  // The notification email address for a customer, if one is on file.
  public func emailFor(state : State, customerId : Common.CustomerId) : ?Text {
    switch (state.customers.get(customerId)) {
      case (?customer) { customer.email };
      case null { null };
    };
  };

  // Return the caller's customer id, creating a minimal record on first use so
  // a signed-in caller can book an appointment without a separate registration
  // step. The record carries no phone number, so it never collides with the
  // phone-uniqueness index.
  public func ensureCustomer(state : State, caller : Principal) : Common.CustomerId {
    switch (state.byPrincipal.get(caller)) {
      case (?id) { id };
      case null {
        let now = Int.abs(Time.now());
        let id = state.nextCustomerId;
        state.nextCustomerId := id + 1;
        let customer : Types.Customer = {
          id;
          principal = caller;
          var fullName = "";
          phone = "";
          nationalId = "";
          var email = null;
          var language = #en;
          var verified = false;
          var createdAt = now;
          var updatedAt = now;
        };
        state.customers.add(id, customer);
        state.byPrincipal.add(caller, id);
        id;
      };
    };
  };

  public func getView(state : State, caller : Principal) : Common.Result<Types.CustomerView> {
    switch (getByPrincipal(state, caller)) {
      case (?customer) { #ok(toView(customer)) };
      case null { #err(#notAuthorized) };
    };
  };

  public func updateProfile(state : State, caller : Principal, update : Types.ProfileUpdate) : Common.Result<Types.CustomerView> {
    let customer = switch (getByPrincipal(state, caller)) {
      case (?c) { c };
      case null { return #err(#notAuthorized) };
    };
    switch (update.fullName) {
      case (?name) {
        if (cleanText(name).size() == 0) {
          return #err(#invalidInput("Name cannot be empty."));
        };
        customer.fullName := cleanText(name);
      };
      case null {};
    };
    switch (update.email) {
      case (?email) { customer.email := ?email };
      case null {};
    };
    switch (update.language) {
      case (?lang) { customer.language := lang };
      case null {};
    };
    customer.updatedAt := Int.abs(Time.now());
    #ok(toView(customer));
  };

  public func listDevices(state : State, caller : Principal) : [Types.DeviceView] {
    let customerId = switch (state.byPrincipal.get(caller)) {
      case (?id) { id };
      case null { return [] };
    };
    let result = List.empty<Types.DeviceView>();
    for ((_, device) in state.devices.entries()) {
      if (device.principal == caller or deviceBelongsTo(state, device, customerId)) {
        result.add(toDeviceView(device));
      };
    };
    result.toArray();
  };

  // A device belongs to a customer when its principal maps to that customer.
  func deviceBelongsTo(state : State, device : Types.Device, customerId : Common.CustomerId) : Bool {
    switch (state.byPrincipal.get(device.principal)) {
      case (?id) { id == customerId };
      case null { false };
    };
  };

  public func registerDevice(state : State, caller : Principal, deviceLabel : Text) : Common.Result<Types.DeviceView> {
    switch (state.byPrincipal.get(caller)) {
      case (?_) {};
      case null { return #err(#notAuthorized) };
    };
    let now = Int.abs(Time.now());
    let id = state.nextDeviceId;
    state.nextDeviceId := id + 1;
    let device : Types.Device = {
      id;
      principal = caller;
      deviceLabel = if (cleanText(deviceLabel).size() == 0) { "Device" } else { cleanText(deviceLabel) };
      var createdAt = now;
      var lastSeenAt = now;
      var revoked = false;
    };
    state.devices.add(id, device);
    #ok(toDeviceView(device));
  };

  public func revokeDevice(state : State, caller : Principal, deviceId : Common.DeviceId) : Common.Result<()> {
    let device = switch (state.devices.get(deviceId)) {
      case (?d) { d };
      case null { return #err(#notFound) };
    };
    // Only the owning principal may revoke their own device.
    if (device.principal != caller) {
      return #err(#notAuthorized);
    };
    device.revoked := true;
    #ok(());
  };

  public func startRecovery(state : State, phone : Text) : async Common.Result<()> {
    let normalized = normalizePhone(phone);
    // Do not reveal whether the phone is registered.
    switch (state.byPhone.get(normalized)) {
      case (?_) {
        let now = Int.abs(Time.now());
        let token = await generateToken();
        state.recoveryRequests.add(normalized, {
          phone = normalized;
          var token = token;
          var expiresAt = now + RECOVERY_TTL_NS;
          var consumed = false;
        });
      };
      case null {};
    };
    #ok(());
  };

  public func completeRecovery(state : State, caller : Principal, phone : Text, token : Text) : Common.Result<Types.CustomerView> {
    let normalized = normalizePhone(phone);
    let now = Int.abs(Time.now());
    let request = switch (state.recoveryRequests.get(normalized)) {
      case (?r) { r };
      case null { return #err(#invalidInput("The recovery link is invalid or has expired.")) };
    };
    if (request.consumed or request.expiresAt <= now or request.token != cleanText(token)) {
      return #err(#invalidInput("The recovery link is invalid or has expired."));
    };
    let customerId = switch (state.byPhone.get(normalized)) {
      case (?id) { id };
      case null { return #err(#notFound) };
    };
    let customer = switch (state.customers.get(customerId)) {
      case (?c) { c };
      case null { return #err(#notFound) };
    };
    request.consumed := true;
    // Rebind the account to the recovering principal and revoke old devices.
    state.byPrincipal.add(caller, customerId);
    for ((_, device) in state.devices.entries()) {
      if (deviceBelongsTo(state, device, customerId) and device.principal != caller) {
        device.revoked := true;
      };
    };
    customer.updatedAt := now;
    #ok(toView(customer));
  };
};
