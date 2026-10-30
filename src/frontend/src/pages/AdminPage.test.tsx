import { AuditAction } from "@/backend";
import { AdminPage } from "@/pages/AdminPage";
import {
  actorMock,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import {
  makeAppointmentDetail,
  makeBranch,
  makeQrVerification,
  makeService,
} from "@/test/fixtures";
import { renderAtRoute } from "@/test/render";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

const service = makeService({ id: 1n });
const branch = makeBranch({ id: 1n });

function renderAdmin() {
  return renderAtRoute(() => <AdminPage />, {
    path: "/admin",
    language: "en",
  });
}

async function openScanner(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("admin.tab.scanner"));
  await screen.findByTestId("admin.scanner_input");
}

async function scan(
  user: ReturnType<typeof userEvent.setup>,
  token: string,
  action: "verify" | "checkin" = "verify",
) {
  const input = screen.getByTestId("admin.scanner_input");
  await user.clear(input);
  await user.type(input, token);
  await user.click(
    screen.getByTestId(
      action === "verify"
        ? "admin.scanner_verify_button"
        : "admin.scanner_checkin_button",
    ),
  );
}

describe("AdminPage scanner", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.getServiceCatalogue.mockResolvedValue([service]);
    actorMock.getOfficeLocations.mockResolvedValue([branch]);
    actorMock.listAllAppointments.mockResolvedValue([]);
    actorMock.listAuditLog.mockResolvedValue([]);
  });

  it("verifies a valid QR token and shows the authorized appointment", async () => {
    const user = userEvent.setup();
    actorMock.verifyAppointmentQr.mockResolvedValue(
      makeQrVerification("valid"),
    );

    await renderAdmin();
    await openScanner(user);
    await scan(user, "tok_valid");

    await waitFor(() =>
      expect(actorMock.verifyAppointmentQr).toHaveBeenCalledWith("tok_valid"),
    );
    const result = await screen.findByTestId("admin.scanner_result_state");
    expect(result).toHaveTextContent(/verified/i);
    expect(screen.getByText("ELC-2026-000123")).toBeInTheDocument();
  });

  it("checks in a visitor and reports an already-checked-in repeat scan", async () => {
    const user = userEvent.setup();
    actorMock.checkInAppointment.mockResolvedValueOnce(
      makeQrVerification("valid"),
    );
    actorMock.checkInAppointment.mockResolvedValueOnce(
      makeQrVerification("alreadyCheckedIn"),
    );

    await renderAdmin();
    await openScanner(user);

    await scan(user, "tok_valid", "checkin");
    await waitFor(() =>
      expect(actorMock.checkInAppointment).toHaveBeenCalledTimes(1),
    );

    // A second scan of the same token reports the existing check-in.
    await scan(user, "tok_valid", "checkin");
    await waitFor(() =>
      expect(actorMock.checkInAppointment).toHaveBeenCalledTimes(2),
    );
    const result = await screen.findByTestId("admin.scanner_result_state");
    expect(result).toHaveTextContent(/already been checked in/i);
  });

  it("rejects an unknown QR token with a clear result", async () => {
    const user = userEvent.setup();
    actorMock.verifyAppointmentQr.mockResolvedValue({
      __kind__: "invalid",
      invalid: null,
    });

    await renderAdmin();
    await openScanner(user);
    await scan(user, "not-a-real-token");

    expect(
      await screen.findByTestId("admin.scanner_invalid_state"),
    ).toBeInTheDocument();
  });

  it("rejects a QR code for a cancelled appointment", async () => {
    const user = userEvent.setup();
    actorMock.verifyAppointmentQr.mockResolvedValue(
      makeQrVerification("cancelled"),
    );

    await renderAdmin();
    await openScanner(user);
    await scan(user, "tok_cancelled");

    const result = await screen.findByTestId("admin.scanner_result_state");
    expect(result).toHaveTextContent(/cancelled/i);
  });
});

describe("AdminPage audit log", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.getServiceCatalogue.mockResolvedValue([service]);
    actorMock.getOfficeLocations.mockResolvedValue([branch]);
    actorMock.listAllAppointments.mockResolvedValue([]);
  });

  it("lists recorded audit actions for the administrator", async () => {
    const user = userEvent.setup();
    actorMock.listAuditLog.mockResolvedValue([
      {
        id: 1n,
        action: AuditAction.signIn,
        subject: "principal-1",
        detail: "Signed in",
        createdAt: 1_700_000_000_000_000_000n,
        actorPrincipal: Principal.anonymous(),
      },
      {
        id: 2n,
        action: AuditAction.checkIn,
        subject: "ELC-2026-000123",
        detail: "Visitor checked in",
        createdAt: 1_700_000_000_000_000_000n,
        actorPrincipal: Principal.anonymous(),
      },
    ]);

    await renderAdmin();
    await user.click(screen.getByTestId("admin.tab.audit"));

    expect(await screen.findByTestId("admin.audit_row.1")).toBeInTheDocument();
    expect(screen.getByTestId("admin.audit_row.2")).toBeInTheDocument();
    expect(screen.getByText("signIn")).toBeInTheDocument();
    expect(screen.getByText("checkIn")).toBeInTheDocument();
  });
});
