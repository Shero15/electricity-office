import { RegisterPage } from "@/pages/RegisterPage";
import {
  actorMock,
  authState,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import { renderAtRoute } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

function renderRegister() {
  return renderAtRoute(() => <RegisterPage />, {
    path: "/register",
    language: "en",
    withAuth: true,
  });
}

async function fillDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByTestId("register.full_name_input"),
    "Ada Lovelace",
  );
  await user.type(screen.getByTestId("register.phone_input"), "07701234567");
  await user.type(
    screen.getByTestId("register.national_id_input"),
    "1234567890",
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.isCallerAdmin.mockResolvedValue(false);
    actorMock.recordSignIn.mockResolvedValue(undefined);
  });

  it("requires sign-in before showing the registration form", async () => {
    await renderRegister();
    expect(screen.getByTestId("register.signin_button")).toBeInTheDocument();
    expect(
      screen.queryByTestId("register.full_name_input"),
    ).not.toBeInTheDocument();
  });

  it("registers a customer, verifies the code, and completes registration", async () => {
    const user = userEvent.setup();
    authState.isAuthenticated = true;
    actorMock.registerCustomer.mockResolvedValue({
      __kind__: "ok",
      ok: { id: 1n, fullName: "Ada Lovelace", phone: "07701234567" },
    });
    actorMock.requestPhoneVerification.mockResolvedValue({
      __kind__: "ok",
      ok: null,
    });
    actorMock.verifyPhone.mockResolvedValue({ __kind__: "ok", ok: null });

    await renderRegister();
    await fillDetails(user);
    await user.click(screen.getByTestId("register.submit_button"));

    await waitFor(() =>
      expect(actorMock.registerCustomer).toHaveBeenCalledTimes(1),
    );
    const input = actorMock.registerCustomer.mock.calls[0][0];
    expect(input.phone).toBe("07701234567");
    expect(input.fullName).toBe("Ada Lovelace");

    // Step 2: enter the one-time code.
    await screen.findByTestId("register.code_input");
    await user.type(screen.getByTestId("register.code_input"), "123456");
    await user.click(screen.getByTestId("register.verify_button"));

    await waitFor(() =>
      expect(actorMock.verifyPhone).toHaveBeenCalledWith(
        "07701234567",
        "123456",
      ),
    );
    expect(
      await screen.findByTestId("register.success_state"),
    ).toBeInTheDocument();
  });

  it("rejects a duplicate phone number with a clear message", async () => {
    const user = userEvent.setup();
    authState.isAuthenticated = true;
    actorMock.registerCustomer.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "duplicatePhone" },
    });

    await renderRegister();
    await fillDetails(user);
    await user.click(screen.getByTestId("register.submit_button"));

    const error = await screen.findByTestId("register.error_state");
    expect(error).toHaveTextContent(/already registered/i);
    expect(actorMock.requestPhoneVerification).not.toHaveBeenCalled();
  });
});
