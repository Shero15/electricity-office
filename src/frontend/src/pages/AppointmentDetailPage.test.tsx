import { AppointmentStatus } from "@/backend";
import { AppointmentDetailPage } from "@/pages/AppointmentDetailPage";
import {
  actorMock,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import {
  makeAppointmentDetail,
  makeBranch,
  makeService,
} from "@/test/fixtures";
import { renderAtRoute } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

const service = makeService({ id: 1n });
const branch = makeBranch({ id: 1n });

function renderDetail(appointmentId = "1") {
  return renderAtRoute(
    () => (
      <AppointmentDetailPage appointmentId={appointmentId} justBooked={false} />
    ),
    { path: "/appointments/$appointmentId", language: "en" },
  );
}

describe("AppointmentDetailPage", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.getServiceCatalogue.mockResolvedValue([service]);
    actorMock.getOfficeLocations.mockResolvedValue([branch]);
    actorMock.getAvailability.mockResolvedValue([]);
  });

  it("shows the appointment details and a unique QR code for its token", async () => {
    actorMock.getMyAppointment.mockResolvedValue({
      __kind__: "ok",
      ok: makeAppointmentDetail({
        appointment: {
          id: 1n,
          reference: "ELC-2026-000123",
          status: AppointmentStatus.confirmed,
          date: "2099-01-01",
          slot: "09:00",
          serviceId: 1n,
          branchId: 1n,
          notes: "",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
        },
        qrToken: "tok_unique_123",
      }),
    });

    await renderDetail();

    expect(await screen.findByText("ELC-2026-000123")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    // The QR panel renders a real QR code for the token, not a placeholder.
    expect(screen.getByTestId("qr_code.canvas")).toBeInTheDocument();
    expect(screen.getByText("tok_unique_123")).toBeInTheDocument();
  });

  it("cancels an eligible appointment and reflects the new status", async () => {
    const user = userEvent.setup();
    actorMock.getMyAppointment.mockResolvedValue({
      __kind__: "ok",
      ok: makeAppointmentDetail({
        appointment: {
          id: 1n,
          reference: "ELC-2026-000123",
          status: AppointmentStatus.requested,
          date: "2099-01-01",
          slot: "09:00",
          serviceId: 1n,
          branchId: 1n,
          notes: "",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
        },
      }),
    });
    actorMock.cancelMyAppointment.mockResolvedValue({
      __kind__: "ok",
      ok: null,
    });

    await renderDetail();

    await user.click(
      await screen.findByTestId("appointment_detail.cancel_button"),
    );
    await user.click(
      await screen.findByTestId("appointment_detail.cancel_confirm_button"),
    );

    await waitFor(() =>
      expect(actorMock.cancelMyAppointment).toHaveBeenCalledWith(1n),
    );
  });

  it("does not offer cancel or reschedule for a checked-in appointment", async () => {
    actorMock.getMyAppointment.mockResolvedValue({
      __kind__: "ok",
      ok: makeAppointmentDetail({
        appointment: {
          id: 1n,
          reference: "ELC-2026-000123",
          status: AppointmentStatus.checkedIn,
          date: "2099-01-01",
          slot: "09:00",
          serviceId: 1n,
          branchId: 1n,
          notes: "",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
        },
      }),
    });

    await renderDetail();

    await screen.findByText("ELC-2026-000123");
    expect(
      screen.queryByTestId("appointment_detail.cancel_button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("appointment_detail.reschedule_button"),
    ).not.toBeInTheDocument();
  });
});
