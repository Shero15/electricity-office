import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Types "../types/appointment";
import Common "../types/common";

module {
  public type State = {
    services : Map.Map<Common.ServiceId, Types.Service>;
    branches : Map.Map<Common.BranchId, Types.Branch>;
    appointments : Map.Map<Common.AppointmentId, Types.Appointment>;
    byReference : Map.Map<Text, Common.AppointmentId>;
    byQrToken : Map.Map<Text, Common.AppointmentId>;
    capacities : Map.Map<Text, Types.Capacity>;
    var nextAppointmentId : Nat;
    var nextServiceId : Nat;
    var nextBranchId : Nat;
  };

  // Fixed daily slot grid. Availability is derived from this grid plus
  // per-(branch, service) capacity and existing bookings — never hardcoded
  // per-request.
  let slotGrid : [Text] = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  ];

  let defaultCapacity : Nat = 1;

  func capacityKey(branchId : Common.BranchId, serviceId : Common.ServiceId) : Text {
    branchId.toText() # ":" # serviceId.toText();
  };

  func isActiveStatus(status : Types.AppointmentStatus) : Bool {
    switch (status) {
      case (#cancelled) { false };
      case (_) { true };
    };
  };

  func countBooked(state : State, serviceId : Common.ServiceId, branchId : Common.BranchId, date : Text, slot : Text) : Nat {
    var count = 0;
    for (appointment in state.appointments.values()) {
      if (
        appointment.serviceId == serviceId and
        appointment.branchId == branchId and
        appointment.date == date and
        appointment.slot == slot and
        isActiveStatus(appointment.status)
      ) {
        count += 1;
      };
    };
    count;
  };

  func capacityFor(state : State, branchId : Common.BranchId, serviceId : Common.ServiceId) : Nat {
    switch (state.capacities.get(capacityKey(branchId, serviceId))) {
      case (?capacity) { capacity.perSlot };
      case null { defaultCapacity };
    };
  };

  // Deterministic, unpredictable token derived from a hash of appointment
  // identity plus a per-issue nonce. Never contains private customer data.
  func makeToken(appointmentId : Common.AppointmentId, reference : Text, nonce : Nat) : Text {
    let seed = reference # ":" # appointmentId.toText() # ":" # nonce.toText() # ":" # Time.now().toText();
    let hash = seed.encodeUtf8().hash();
    "QR" # hash.toText();
  };

  func makeReference(appointmentId : Common.AppointmentId) : Text {
    "APT-" # appointmentId.toText();
  };

  func detailOf(state : State, appointment : Types.Appointment) : Types.AppointmentDetail {
    {
      appointment = appointmentToView(appointment);
      service = switch (state.services.get(appointment.serviceId)) {
        case (?service) { ?serviceToView(service) };
        case null { null };
      };
      branch = switch (state.branches.get(appointment.branchId)) {
        case (?branch) { ?branchToView(branch) };
        case null { null };
      };
      qrToken = appointment.qrToken;
    };
  };

  func findOwned(state : State, customerId : Common.CustomerId, appointmentId : Common.AppointmentId) : ?Types.Appointment {
    switch (state.appointments.get(appointmentId)) {
      case (?appointment) {
        if (appointment.customerId == customerId) { ?appointment } else { null };
      };
      case null { null };
    };
  };

  public func initState() : State {
    {
      services = Map.empty();
      branches = Map.empty();
      appointments = Map.empty();
      byReference = Map.empty();
      byQrToken = Map.empty();
      capacities = Map.empty();
      var nextAppointmentId = 1;
      var nextServiceId = 1;
      var nextBranchId = 1;
    };
  };

  public func serviceToView(service : Types.Service) : Types.ServiceView {
    {
      id = service.id;
      code = service.code;
      nameEn = service.nameEn;
      nameAr = service.nameAr;
      nameKu = service.nameKu;
      descriptionEn = service.descriptionEn;
      descriptionAr = service.descriptionAr;
      descriptionKu = service.descriptionKu;
      requiredDocumentsEn = service.requiredDocumentsEn;
      requiredDocumentsAr = service.requiredDocumentsAr;
      requiredDocumentsKu = service.requiredDocumentsKu;
      fee = service.fee;
      active = service.active;
    };
  };

  public func branchToView(branch : Types.Branch) : Types.BranchView {
    {
      id = branch.id;
      code = branch.code;
      nameEn = branch.nameEn;
      nameAr = branch.nameAr;
      nameKu = branch.nameKu;
      addressEn = branch.addressEn;
      addressAr = branch.addressAr;
      addressKu = branch.addressKu;
      phone = branch.phone;
      active = branch.active;
    };
  };

  public func appointmentToView(appointment : Types.Appointment) : Types.AppointmentView {
    {
      id = appointment.id;
      reference = appointment.reference;
      serviceId = appointment.serviceId;
      branchId = appointment.branchId;
      date = appointment.date;
      slot = appointment.slot;
      status = appointment.status;
      notes = appointment.notes;
      checkedInAt = appointment.checkedInAt;
      createdAt = appointment.createdAt;
      updatedAt = appointment.updatedAt;
    };
  };

  public func listServices(state : State) : [Types.ServiceView] {
    let views = state.services.values().map(func service = serviceToView(service)).toArray();
    views.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func listBranches(state : State) : [Types.BranchView] {
    let views = state.branches.values().map(func branch = branchToView(branch)).toArray();
    views.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func getAvailability(state : State, serviceId : Common.ServiceId, branchId : Common.BranchId, date : Text) : [Types.SlotAvailability] {
    let capacity = capacityFor(state, branchId, serviceId);
    slotGrid.map(func slot {
      let booked = countBooked(state, serviceId, branchId, date, slot);
      let remaining = if (booked >= capacity) { 0 } else { capacity - booked };
      {
        slot = slot;
        available = remaining > 0;
        remaining = remaining;
      };
    });
  };

  public func book(state : State, customerId : Common.CustomerId, input : Types.BookingInput) : Common.Result<Types.AppointmentDetail> {
    if (input.date.size() == 0 or input.slot.size() == 0) {
      return #err(#invalidInput("date and slot are required"));
    };
    switch (state.services.get(input.serviceId)) {
      case null { return #err(#notFound) };
      case (?service) {
        if (not service.active) { return #err(#invalidInput("service is not available")) };
      };
    };
    switch (state.branches.get(input.branchId)) {
      case null { return #err(#notFound) };
      case (?branch) {
        if (not branch.active) { return #err(#invalidInput("branch is not available")) };
      };
    };
    if (not slotGrid.contains(input.slot)) {
      return #err(#invalidInput("unknown time slot"));
    };
    let capacity = capacityFor(state, input.branchId, input.serviceId);
    let booked = countBooked(state, input.serviceId, input.branchId, input.date, input.slot);
    if (booked >= capacity) {
      return #err(#conflict("the selected time slot is no longer available"));
    };

    let id = state.nextAppointmentId;
    state.nextAppointmentId := id + 1;
    let reference = makeReference(id);
    let now = Int.abs(Time.now());
    let appointment : Types.Appointment = {
      id = id;
      reference = reference;
      customerId = customerId;
      serviceId = input.serviceId;
      branchId = input.branchId;
      date = input.date;
      slot = input.slot;
      var status = #requested;
      var notes = input.notes;
      var qrToken = makeToken(id, reference, now);
      var checkedInAt = null;
      var createdAt = now;
      var updatedAt = now;
    };
    state.appointments.add(id, appointment);
    state.byReference.add(reference, id);
    state.byQrToken.add(appointment.qrToken, id);
    #ok(detailOf(state, appointment));
  };

  public func listForCustomer(state : State, customerId : Common.CustomerId) : [Types.AppointmentView] {
    let views = state.appointments.values()
      .filter(func appointment = appointment.customerId == customerId)
      .map(func appointment = appointmentToView(appointment))
      .toArray();
    views.sort(func (a, b) = Nat.compare(b.createdAt, a.createdAt));
  };

  public func getDetail(state : State, customerId : Common.CustomerId, appointmentId : Common.AppointmentId) : Common.Result<Types.AppointmentDetail> {
    switch (findOwned(state, customerId, appointmentId)) {
      case (?appointment) { #ok(detailOf(state, appointment)) };
      case null { #err(#notFound) };
    };
  };

  public func reschedule(state : State, customerId : Common.CustomerId, appointmentId : Common.AppointmentId, date : Text, slot : Text) : Common.Result<Types.AppointmentDetail> {
    if (date.size() == 0 or slot.size() == 0) {
      return #err(#invalidInput("date and slot are required"));
    };
    if (not slotGrid.contains(slot)) {
      return #err(#invalidInput("unknown time slot"));
    };
    switch (findOwned(state, customerId, appointmentId)) {
      case null { #err(#notFound) };
      case (?appointment) {
        switch (appointment.status) {
          case (#cancelled) { return #err(#invalidInput("cancelled appointments cannot be rescheduled")) };
          case (#checkedIn) { return #err(#invalidInput("checked-in appointments cannot be rescheduled")) };
          case (_) {};
        };
        let capacity = capacityFor(state, appointment.branchId, appointment.serviceId);
        let booked = countBooked(state, appointment.serviceId, appointment.branchId, date, slot);
        if (booked >= capacity) {
          return #err(#conflict("the selected time slot is no longer available"));
        };
        let now = Int.abs(Time.now());
        let updated : Types.Appointment = {
          id = appointment.id;
          reference = appointment.reference;
          customerId = appointment.customerId;
          serviceId = appointment.serviceId;
          branchId = appointment.branchId;
          date = date;
          slot = slot;
          var status = #rescheduled;
          var notes = appointment.notes;
          var qrToken = appointment.qrToken;
          var checkedInAt = appointment.checkedInAt;
          var createdAt = appointment.createdAt;
          var updatedAt = now;
        };
        state.appointments.add(appointment.id, updated);
        #ok(detailOf(state, updated));
      };
    };
  };

  public func cancel(state : State, customerId : Common.CustomerId, appointmentId : Common.AppointmentId) : Common.Result<Types.AppointmentDetail> {
    switch (findOwned(state, customerId, appointmentId)) {
      case null { #err(#notFound) };
      case (?appointment) {
        switch (appointment.status) {
          case (#cancelled) { return #err(#invalidInput("appointment is already cancelled")) };
          case (#checkedIn) { return #err(#invalidInput("checked-in appointments cannot be cancelled")) };
          case (_) {};
        };
        appointment.status := #cancelled;
        appointment.updatedAt := Int.abs(Time.now());
        #ok(detailOf(state, appointment));
      };
    };
  };

  public func verifyQr(state : State, token : Text) : Types.QrVerification {
    switch (state.byQrToken.get(token)) {
      case null { #invalid };
      case (?appointmentId) {
        switch (state.appointments.get(appointmentId)) {
          case null { #invalid };
          case (?appointment) {
            switch (appointment.status) {
              case (#cancelled) { #cancelled(detailOf(state, appointment)) };
              case (#checkedIn) { #alreadyCheckedIn(detailOf(state, appointment)) };
              case (_) { #valid(detailOf(state, appointment)) };
            };
          };
        };
      };
    };
  };

  public func checkIn(state : State, token : Text) : Types.QrVerification {
    switch (state.byQrToken.get(token)) {
      case null { #invalid };
      case (?appointmentId) {
        switch (state.appointments.get(appointmentId)) {
          case null { #invalid };
          case (?appointment) {
            switch (appointment.status) {
              case (#cancelled) { #cancelled(detailOf(state, appointment)) };
              case (#checkedIn) { #alreadyCheckedIn(detailOf(state, appointment)) };
              case (_) {
                let now = Int.abs(Time.now());
                appointment.status := #checkedIn;
                appointment.checkedInAt := ?now;
                appointment.updatedAt := now;
                #valid(detailOf(state, appointment));
              };
            };
          };
        };
      };
    };
  };

  public func listAll(state : State) : [Types.AppointmentView] {
    let views = state.appointments.values().map(func appointment = appointmentToView(appointment)).toArray();
    views.sort(func (a, b) = Nat.compare(b.createdAt, a.createdAt));
  };

  // The owning customer id for an appointment, if it exists.
  public func customerIdOf(state : State, appointmentId : Common.AppointmentId) : ?Common.CustomerId {
    switch (state.appointments.get(appointmentId)) {
      case (?appointment) { ?appointment.customerId };
      case null { null };
    };
  };

  public func setStatus(state : State, appointmentId : Common.AppointmentId, status : Types.AppointmentStatus) : Common.Result<Types.AppointmentView> {
    switch (state.appointments.get(appointmentId)) {
      case null { #err(#notFound) };
      case (?appointment) {
        appointment.status := status;
        appointment.updatedAt := Int.abs(Time.now());
        #ok(appointmentToView(appointment));
      };
    };
  };

  public func upsertService(state : State, view : Types.ServiceView) : Common.Result<Types.ServiceView> {
    if (view.code.size() == 0 or view.nameEn.size() == 0) {
      return #err(#invalidInput("service code and name are required"));
    };
    let id = if (view.id == 0) {
      let next = state.nextServiceId;
      state.nextServiceId := next + 1;
      next;
    } else {
      view.id;
    };
    let service : Types.Service = {
      id = id;
      code = view.code;
      nameEn = view.nameEn;
      nameAr = view.nameAr;
      nameKu = view.nameKu;
      descriptionEn = view.descriptionEn;
      descriptionAr = view.descriptionAr;
      descriptionKu = view.descriptionKu;
      requiredDocumentsEn = view.requiredDocumentsEn;
      requiredDocumentsAr = view.requiredDocumentsAr;
      requiredDocumentsKu = view.requiredDocumentsKu;
      fee = view.fee;
      var active = view.active;
    };
    state.services.add(id, service);
    #ok(serviceToView(service));
  };

  public func upsertBranch(state : State, view : Types.BranchView) : Common.Result<Types.BranchView> {
    if (view.code.size() == 0 or view.nameEn.size() == 0) {
      return #err(#invalidInput("branch code and name are required"));
    };
    let id = if (view.id == 0) {
      let next = state.nextBranchId;
      state.nextBranchId := next + 1;
      next;
    } else {
      view.id;
    };
    let branch : Types.Branch = {
      id = id;
      code = view.code;
      nameEn = view.nameEn;
      nameAr = view.nameAr;
      nameKu = view.nameKu;
      addressEn = view.addressEn;
      addressAr = view.addressAr;
      addressKu = view.addressKu;
      phone = view.phone;
      var active = view.active;
    };
    state.branches.add(id, branch);
    #ok(branchToView(branch));
  };

  public func setCapacity(state : State, branchId : Common.BranchId, serviceId : Common.ServiceId, perSlot : Nat) : Common.Result<()> {
    if (perSlot == 0) {
      return #err(#invalidInput("capacity must be at least 1"));
    };
    state.capacities.add(capacityKey(branchId, serviceId), {
      branchId = branchId;
      serviceId = serviceId;
      var perSlot = perSlot;
    });
    #ok(());
  };
};
