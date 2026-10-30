import OQL "mo:caffeineai-oql";
import Types "types/admin";

module {
  // Variant → tag text, so the audit action derives as a single Text column
  // and stays filterable.
  public func _toRow(self : Types.AuditAction) : OQL.Value {
    #text(
      switch (self) {
        case (#signIn) { "signIn" };
        case (#signOut) { "signOut" };
        case (#registration) { "registration" };
        case (#verification) { "verification" };
        case (#bookingCreated) { "bookingCreated" };
        case (#bookingRescheduled) { "bookingRescheduled" };
        case (#bookingCancelled) { "bookingCancelled" };
        case (#statusChanged) { "statusChanged" };
        case (#qrScan) { "qrScan" };
        case (#qrVerified) { "qrVerified" };
        case (#checkIn) { "checkIn" };
        case (#accessDenied) { "accessDenied" };
        case (#roleAssigned) { "roleAssigned" };
        case (#deviceRevoked) { "deviceRevoked" };
        case (#settingsChanged) { "settingsChanged" };
      }
    );
  };
};
