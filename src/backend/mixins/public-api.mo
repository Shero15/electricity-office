import AppointmentLib "../lib/appointment";
import AppointmentTypes "../types/appointment";

mixin (appointments : AppointmentLib.State) {
  public query func getServiceCatalogue() : async [AppointmentTypes.ServiceView] {
    AppointmentLib.listServices(appointments);
  };

  public query func getOfficeLocations() : async [AppointmentTypes.BranchView] {
    AppointmentLib.listBranches(appointments);
  };
};
