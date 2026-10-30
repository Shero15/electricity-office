import { BookPage } from "@/pages/BookPage";
import {
  actorMock,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import { makeBranch, makeService } from "@/test/fixtures";
import { renderAtRoute } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

const service = makeService({ id: 1n, nameEn: "Commercial subscription" });
const branch = makeBranch({ id: 1n, nameEn: "Head office" });

function renderBook() {
  return renderAtRoute(() => <BookPage />, {
    path: "/book",
    language: "en",
  });
}

/** Open a Radix select by its trigger test id and pick the option by label. */
async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  triggerId: string,
  optionLabel: string | RegExp,
) {
  await user.click(screen.getByTestId(triggerId));
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getByRole("option", { name: optionLabel }));
}

describe("BookPage", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.getServiceCatalogue.mockResolvedValue([service]);
    actorMock.getOfficeLocations.mockResolvedValue([branch]);
  });

  it("books a slot drawn from server-side availability and issues a reference", async () => {
    const user = userEvent.setup();
    actorMock.getAvailability.mockResolvedValue([
      { slot: "09:00", available: true, remaining: 1n },
      { slot: "09:30", available: false, remaining: 0n },
    ]);
    actorMock.bookAppointment.mockResolvedValue({
      __kind__: "ok",
      ok: {
        appointment: {
          id: 7n,
          reference: "ELC-2026-000007",
          status: "requested",
          date: "2099-01-01",
          slot: "09:00",
          serviceId: 1n,
          branchId: 1n,
          notes: "",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
        },
        service,
        branch,
        qrToken: "tok_7",
      },
    });

    await renderBook();

    // Step 1: choose the service.
    await chooseOption(
      user,
      "booking.service_select",
      "Commercial subscription",
    );
    await user.click(screen.getByTestId("booking.next_button"));

    // Step 2: choose the branch.
    await chooseOption(user, "booking.branch_select", "Head office");
    await user.click(screen.getByTestId("booking.next_button"));

    // Step 3: the slot list comes from the backend, not a hardcoded list.
    const openSlot = await screen.findByTestId("booking.slot.1");
    expect(openSlot).toHaveTextContent("09:00");
    expect(screen.getByTestId("booking.slot.2")).toBeDisabled();
    await user.click(openSlot);

    await user.click(screen.getByTestId("booking.confirm_button"));

    await waitFor(() =>
      expect(actorMock.bookAppointment).toHaveBeenCalledTimes(1),
    );
    const input = actorMock.bookAppointment.mock.calls[0][0];
    expect(input.serviceId).toBe(1n);
    expect(input.branchId).toBe(1n);
    expect(input.slot).toBe("09:00");
  });

  it("rejects a slot that was taken concurrently with a clear message", async () => {
    const user = userEvent.setup();
    actorMock.getAvailability.mockResolvedValue([
      { slot: "09:00", available: true, remaining: 1n },
    ]);
    actorMock.bookAppointment.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "conflict" },
    });

    await renderBook();

    await chooseOption(
      user,
      "booking.service_select",
      "Commercial subscription",
    );
    await user.click(screen.getByTestId("booking.next_button"));
    await chooseOption(user, "booking.branch_select", "Head office");
    await user.click(screen.getByTestId("booking.next_button"));

    await user.click(await screen.findByTestId("booking.slot.1"));
    await user.click(screen.getByTestId("booking.confirm_button"));

    const error = await screen.findByTestId("booking.error_state");
    expect(error).toHaveTextContent(/taken/i);
  });

  it("shows an empty state when the backend reports no available slots", async () => {
    const user = userEvent.setup();
    actorMock.getAvailability.mockResolvedValue([]);

    await renderBook();

    await chooseOption(
      user,
      "booking.service_select",
      "Commercial subscription",
    );
    await user.click(screen.getByTestId("booking.next_button"));
    await chooseOption(user, "booking.branch_select", "Head office");
    await user.click(screen.getByTestId("booking.next_button"));

    expect(
      await screen.findByTestId("booking.slots_empty_state"),
    ).toBeInTheDocument();
  });
});
