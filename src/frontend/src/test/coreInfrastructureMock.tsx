import type { backendInterface } from "@/backend";
import { vi } from "vitest";

/**
 * Test double for `@caffeineai/core-infrastructure`.
 *
 * Test files install it with:
 *
 *   vi.mock("@caffeineai/core-infrastructure", () =>
 *     import("@/test/coreInfrastructureMock"),
 *   );
 *
 * The module exposes a mutable `actorMock` (a typed `backendInterface` whose
 * methods are Vitest spies) and a mutable `authState` that drives
 * `useInternetIdentity`. Tests set the actor's resolved values per method and
 * flip `authState` to simulate signed-in / admin / anonymous callers.
 */

export type AuthState = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  isLoginError: boolean;
  isSessionExpired: boolean;
};

export const authState: AuthState = {
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  isLoginError: false,
  isSessionExpired: false,
};

export const loginSpy = vi.fn();
export const clearSpy = vi.fn();

export function resetAuthState(overrides: Partial<AuthState> = {}): void {
  authState.isAuthenticated = false;
  authState.isInitializing = false;
  authState.isLoggingIn = false;
  authState.isLoginError = false;
  authState.isSessionExpired = false;
  Object.assign(authState, overrides);
}

type ActorMock = {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

function createActorMock(): ActorMock {
  return {
    _initialize_access_control: vi.fn(),
    _internet_identity_sign_in_finish: vi.fn(),
    _internet_identity_sign_in_start: vi.fn(),
    assignCallerUserRole: vi.fn(),
    bookAppointment: vi.fn(),
    cancelMyAppointment: vi.fn(),
    checkInAppointment: vi.fn(),
    completeAccountRecovery: vi.fn(),
    execute: vi.fn(),
    getApiDoc: vi.fn(),
    getAvailability: vi.fn(),
    getCallerUserRole: vi.fn(),
    getMyAppointment: vi.fn(),
    getMyProfile: vi.fn(),
    getNotificationSettings: vi.fn(),
    getOfficeLocations: vi.fn(),
    getRetentionSettings: vi.fn(),
    getServiceCatalogue: vi.fn(),
    isCallerAdmin: vi.fn(),
    listAllAppointments: vi.fn(),
    listAuditLog: vi.fn(),
    listBranches: vi.fn(),
    listMyAppointments: vi.fn(),
    listMyDevices: vi.fn(),
    listServices: vi.fn(),
    recordSignIn: vi.fn(),
    registerCustomer: vi.fn(),
    registerMyDevice: vi.fn(),
    requestPhoneVerification: vi.fn(),
    rescheduleMyAppointment: vi.fn(),
    revokeMyDevice: vi.fn(),
    schema: vi.fn(),
    setAppointmentStatus: vi.fn(),
    setSlotCapacity: vi.fn(),
    startAccountRecovery: vi.fn(),
    updateMyProfile: vi.fn(),
    updateNotificationSettings: vi.fn(),
    updateRetentionSettings: vi.fn(),
    upsertBranch: vi.fn(),
    upsertService: vi.fn(),
    verifyAppointmentQr: vi.fn(),
    verifyPhone: vi.fn(),
  };
}

export const actorMock = createActorMock();

/** Reset every actor spy and the auth state between tests. */
export function resetCoreInfrastructure(): void {
  for (const spy of Object.values(actorMock)) {
    spy.mockReset();
  }
  loginSpy.mockReset();
  clearSpy.mockReset();
  resetAuthState();
}

export function useActor() {
  return { actor: actorMock as unknown as backendInterface, isFetching: false };
}

export function useInternetIdentity() {
  return {
    identity: undefined,
    login: loginSpy,
    clear: clearSpy,
    loginStatus: "idle",
    isInitializing: authState.isInitializing,
    isLoginIdle: !authState.isLoggingIn,
    isLoggingIn: authState.isLoggingIn,
    isLoginSuccess: false,
    isLoginError: authState.isLoginError,
    isSessionExpired: authState.isSessionExpired,
    isAuthenticated: authState.isAuthenticated,
  };
}

export function InternetIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
