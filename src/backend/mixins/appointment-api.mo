import Principal "mo:core/Principal";
import AppointmentLib "../lib/appointment";
import CustomerLib "../lib/customer";
import AdminLib "../lib/admin";
import AppointmentTypes "../types/appointment";
import Common "../types/common";

mixin (appointments : AppointmentLib.State, customers : CustomerLib.State, admin : AdminLib.State) {
  func callerCustomerId(caller : Principal) : ?Common.CustomerId {
    switch (CustomerLib.getByPrincipal(customers, caller)) {
      case (?customer) { ?customer.id };
      case null { null };
    };
  };

  public query func listServices() : async [AppointmentTypes.ServiceView] {
    AppointmentLib.listServices(appointments);
  };

  public query func listBranches() : async [AppointmentTypes.BranchView] {
    AppointmentLib.listBranches(appointments);
  };

  public query func getAvailability(serviceId : Common.ServiceId, branchId : Common.BranchId, date : Text) : async [AppointmentTypes.SlotAvailability] {
    AppointmentLib.getAvailability(appointments, serviceId, branchId, date);
  };

  public shared ({ caller }) func bookAppointment(input : AppointmentTypes.BookingInput) : async Common.Result<AppointmentTypes.AppointmentDetail> {
    let customerId = CustomerLib.ensureCustomer(customers, caller);
    let result = AppointmentLib.book(appointments, customerId, input);
    switch (result) {
      case (#ok(detail)) {
        AdminLib.record(admin, caller, #bookingCreated, detail.appointment.reference, "Appointment requested.");
        switch (CustomerLib.emailFor(customers, customerId)) {
          case (?email) {
            await AdminLib.notify(
              admin,
              #appointmentRequested,
              email,
              "Appointment request received",
              "Your appointment request " # detail.appointment.reference # " for " # detail.appointment.date # " at " # detail.appointment.slot # " has been received.",
            );
          };
          case null {};
        };
      };
      case (#err(_)) {};
    };
    result;
  };

  public query ({ caller }) func listMyAppointments() : async [AppointmentTypes.AppointmentView] {
    switch (callerCustomerId(caller)) {
      case null { ([] : [AppointmentTypes.AppointmentView]) };
      case (?customerId) { AppointmentLib.listForCustomer(appointments, customerId) };
    };
  };

  public query ({ caller }) func getMyAppointment(appointmentId : Common.AppointmentId) : async Common.Result<AppointmentTypes.AppointmentDetail> {
    switch (callerCustomerId(caller)) {
      case null { #err(#notAuthorized) };
      case (?customerId) { AppointmentLib.getDetail(appointments, customerId, appointmentId) };
    };
  };

  public shared ({ caller }) func rescheduleMyAppointment(appointmentId : Common.AppointmentId, date : Text, slot : Text) : async Common.Result<AppointmentTypes.AppointmentDetail> {
    switch (callerCustomerId(caller)) {
      case null { #err(#notAuthorized) };
      case (?customerId) {
        let result = AppointmentLib.reschedule(appointments, customerId, appointmentId, date, slot);
        switch (result) {
          case (#ok(detail)) {
            AdminLib.record(admin, caller, #bookingRescheduled, detail.appointment.reference, "Appointment rescheduled.");
            switch (CustomerLib.emailFor(customers, customerId)) {
              case (?email) {
                await AdminLib.notify(
                  admin,
                  #appointmentRescheduled,
                  email,
                  "Appointment rescheduled",
                  "Your appointment " # detail.appointment.reference # " has been rescheduled to " # detail.appointment.date # " at " # detail.appointment.slot # ".",
                );
              };
              case null {};
            };
          };
          case (#err(_)) {};
        };
        result;
      };
    };
  };

  public shared ({ caller }) func cancelMyAppointment(appointmentId : Common.AppointmentId) : async Common.Result<AppointmentTypes.AppointmentDetail> {
    switch (callerCustomerId(caller)) {
      case null { #err(#notAuthorized) };
      case (?customerId) {
        let result = AppointmentLib.cancel(appointments, customerId, appointmentId);
        switch (result) {
          case (#ok(detail)) {
            AdminLib.record(admin, caller, #bookingCancelled, detail.appointment.reference, "Appointment cancelled.");
            switch (CustomerLib.emailFor(customers, customerId)) {
              case (?email) {
                await AdminLib.notify(
                  admin,
                  #appointmentCancelled,
                  email,
                  "Appointment cancelled",
                  "Your appointment " # detail.appointment.reference # " has been cancelled.",
                );
              };
              case null {};
            };
          };
          case (#err(_)) {};
        };
        result;
      };
    };
  };
};
