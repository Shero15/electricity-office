import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Generated components expose stable `data-ocid` hooks; map them to the
// testing-library test id attribute so tests can target them without
// depending on brittle CSS classes.
configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement the pointer-capture and layout APIs that Radix UI
// primitives (Select, Dialog, AlertDialog) call while opening. Without these
// shims, interacting with a Radix Select throws
// `target.hasPointerCapture is not a function` and the menu never opens.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
  vi.restoreAllMocks();
});
