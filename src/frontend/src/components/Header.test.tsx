import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import {
  actorMock,
  resetCoreInfrastructure,
} from "@/test/coreInfrastructureMock";
import { renderAtRoute } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

/** A form whose in-progress value must survive a language switch. */
function FormProbe() {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  return (
    <div>
      <label htmlFor="probe">{t.register.fullNameLabel}</label>
      <Input
        id="probe"
        data-ocid="probe.input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}

function Harness() {
  return (
    <div>
      <Header />
      <FormProbe />
    </div>
  );
}

function renderHeader() {
  return renderAtRoute(() => <Harness />, {
    path: "/",
    language: "en",
    withAuth: true,
  });
}

async function switchLanguage(
  user: ReturnType<typeof userEvent.setup>,
  code: "en" | "ar" | "ku",
) {
  await user.click(screen.getByTestId("header.language_button"));
  await user.click(await screen.findByTestId(`header.language_option.${code}`));
}

describe("Header language switching", () => {
  beforeEach(() => {
    resetCoreInfrastructure();
    actorMock.isCallerAdmin.mockResolvedValue(false);
  });

  it("switches the whole UI to RTL and translates strings for Kurdish Sorani", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await switchLanguage(user, "ku");

    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
    expect(document.documentElement.lang).toBe("ku");
    // The header nav is translated, not left in English.
    expect(screen.getByTestId("header.nav.home")).not.toHaveTextContent("Home");
  });

  it("switches to LTR for English", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await switchLanguage(user, "ar");
    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));

    await switchLanguage(user, "en");
    await waitFor(() => expect(document.documentElement.dir).toBe("ltr"));
    expect(screen.getByTestId("header.nav.home")).toHaveTextContent("Home");
  });

  it("persists the selected language across sessions", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await switchLanguage(user, "ar");

    await waitFor(() =>
      expect(window.localStorage.getItem("eco.language")).toBe("ar"),
    );
  });

  it("keeps in-progress form data when the language changes", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await user.type(screen.getByTestId("probe.input"), "Ada Lovelace");
    expect(screen.getByTestId("probe.input")).toHaveValue("Ada Lovelace");

    await switchLanguage(user, "ku");

    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
    // The typed value is not lost by the language switch.
    expect(screen.getByTestId("probe.input")).toHaveValue("Ada Lovelace");
  });
});
