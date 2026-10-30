import { LanguageGate } from "@/components/LanguageGate";
import { LanguageProvider } from "@/context/LanguageContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function renderGate() {
  return render(
    <LanguageProvider>
      <LanguageGate />
    </LanguageProvider>,
  );
}

describe("LanguageGate", () => {
  it("is the first screen and offers all three languages", () => {
    renderGate();
    expect(
      screen.getByRole("heading", { name: /choose your language/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("language.option.ku")).toBeInTheDocument();
    expect(screen.getByTestId("language.option.ar")).toBeInTheDocument();
    expect(screen.getByTestId("language.option.en")).toBeInTheDocument();
    expect(screen.getByText("کوردیی سۆرانی")).toBeInTheDocument();
    expect(screen.getByText("العربية")).toBeInTheDocument();
  });

  it("persists the chosen language and applies the direction", async () => {
    const user = userEvent.setup();
    renderGate();

    await user.click(screen.getByTestId("language.option.ar"));
    await user.click(screen.getByTestId("language.continue_button"));

    expect(window.localStorage.getItem("eco.language")).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });

  it("applies left-to-right for English", async () => {
    const user = userEvent.setup();
    renderGate();

    await user.click(screen.getByTestId("language.option.en"));
    await user.click(screen.getByTestId("language.continue_button"));

    expect(window.localStorage.getItem("eco.language")).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
