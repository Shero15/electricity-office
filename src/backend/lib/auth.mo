import AccessControl "mo:caffeineai-authorization/access-control";
import Principal "mo:core/Principal";

module {
  // Read-only administrator check that never traps. An unregistered principal
  // is treated as a non-administrator. Safe to call from query functions,
  // which cannot mutate the role map.
  public func isAdminSafe(state : AccessControl.AccessControlState, caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (state.userRoles.get(caller)) {
      case (?#admin) { true };
      case (_) { false };
    };
  };

  // Update-path administrator check. Registers the caller if unknown — the
  // first registered principal becomes the administrator — then reports
  // whether the caller is an administrator. Never traps.
  public func isAdminEnsuring(state : AccessControl.AccessControlState, caller : Principal) : Bool {
    AccessControl.initialize(state, caller);
    isAdminSafe(state, caller);
  };
};
