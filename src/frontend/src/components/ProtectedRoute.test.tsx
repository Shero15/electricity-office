import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  actorMock,
  authState,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import { renderAtRoute } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

function renderProtected(requiredRole: "user" | "admin" = "user") {
  return renderAtRoute(
    () => (
      <ProtectedRoute requiredRole={requiredRole}>
        <div data-ocid="protected.child">Secret area</div>
      </ProtectedRoute>
    ),
    { path: "/admin", language: "en", withAuth: true },
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.recordSignIn.mockResolvedValue(undefined);
    actorMock.isCallerAdmin.mockResolvedValue(false);
  });

  it("prompts an anonymous visitor to sign in instead of showing the area", async () => {
    await renderProtected("admin");

    expect(
      await screen.findByTestId("protected.signin_button"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("protected.child")).not.toBeInTheDocument();
  });

  it("blocks a signed-in customer from the administrator area", async () => {
    authState.isAuthenticated = true;
    actorMock.isCallerAdmin.mockResolvedValue(false);

    await renderProtected("admin");

    await waitFor(() => expect(actorMock.isCallerAdmin).toHaveBeenCalled());
    expect(
      await screen.findByText(/administrator access only/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("protected.child")).not.toBeInTheDocument();
  });

  it("admits an administrator to the protected area", async () => {
    authState.isAuthenticated = true;
    actorMock.isCallerAdmin.mockResolvedValue(true);

    await renderProtected("admin");

    expect(await screen.findByTestId("protected.child")).toBeInTheDocument();
  });

  it("admits any signed-in customer to a user-only area", async () => {
    authState.isAuthenticated = true;
    actorMock.isCallerAdmin.mockResolvedValue(false);

    await renderProtected("user");

    expect(await screen.findByTestId("protected.child")).toBeInTheDocument();
  });
});
