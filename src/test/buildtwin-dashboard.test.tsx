import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

vi.mock("@/components/buildtwin/ThreeModel", () => ({
  ThreeModel: () => <div data-testid="scene-preview" />,
}));

async function renderDashboard() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { queryClient: new QueryClient() },
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

describe("BuildTwin dashboard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the project twin, analytics, scan alert, and switches viewer modes", async () => {
    await renderDashboard();

    expect(screen.getByText("Scan #42 completed. Detected a 2-day delay on Level 1 slab. Shall I update dependencies?")).toBeInTheDocument();
    expect(screen.getByText("PLANNED VS ACTUAL")).toBeInTheDocument();
    expect(screen.getByText("WORK PACKAGE STATUS")).toBeInTheDocument();

    const scanButton = screen.getByRole("button", { name: /Site scan/ });
    fireEvent.click(scanButton);

    expect(scanButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Overlay/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("changes the selected project and applies local display settings", async () => {
    await renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: /Northline Medical Pavilion/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Harbor Exchange Tower/ }));
    expect(screen.getByRole("heading", { name: "Project overview" })).toBeInTheDocument();
    expect(document.querySelector(".heading-row p")).toHaveTextContent("Harbor Exchange Tower");

    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    const dialog = screen.getByRole("dialog", { name: "Workspace settings" });
    expect(dialog).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /Model coordinates/ }));
    fireEvent.change(screen.getByRole("combobox", { name: "Measurement units" }), { target: { value: "imperial" } });
    expect(screen.getByRole("combobox", { name: "Measurement units" })).toHaveValue("imperial");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("N 39°44′12.8″")).not.toBeInTheDocument();
  });

  it("sends chat messages and returns a simulated field response", async () => {
    vi.useFakeTimers();
    await renderDashboard();
    const input = screen.getByRole("textbox", { name: "Message the AI Site Manager" });

    fireEvent.change(input, { target: { value: "What is the rebar status?" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByText("What is the rebar status?")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Site Manager is typing" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/rebar cage installation at 88%/i)).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Site Manager is typing" })).not.toBeInTheDocument();
  });
});
