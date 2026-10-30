import OQL "mo:caffeineai-oql";
import Types "types/appointment";

module {
  // Variant → tag text, so the appointment status derives as a single Text
  // column and stays filterable.
  public func _toRow(self : Types.AppointmentStatus) : OQL.Value {
    #text(
      switch (self) {
        case (#requested) { "requested" };
        case (#confirmed) { "confirmed" };
        case (#rescheduled) { "rescheduled" };
        case (#cancelled) { "cancelled" };
        case (#checkedIn) { "checkedIn" };
      }
    );
  };
};
