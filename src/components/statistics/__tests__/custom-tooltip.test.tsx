// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomTooltip } from "@/components/statistics/custom-tooltip";
import { SalaryDisplayProvider } from "@/contexts/salary-display-context";

// next-intl's useTranslations -> echo the key so assertions can key off label ids.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function renderTooltip(props: Parameters<typeof CustomTooltip>[0]) {
  return render(
    <SalaryDisplayProvider>
      <CustomTooltip {...props} />
    </SalaryDisplayProvider>
  );
}

describe("CustomTooltip", () => {
  it("shows the median salary for the experience GROWTH chart (not N/A)", () => {
    // Growth chart datum shape: { experience, avgSalary, medianSalary, count }.
    // It has NO five-number summary (min/q1/median/q3/max).
    const payload = [
      {
        dataKey: "medianSalary",
        value: 4200,
        color: "#ea580c",
        payload: { experience: 22, avgSalary: 4300, medianSalary: 4200, count: 13 },
      },
    ];

    renderTooltip({ active: true, label: 22, chartType: "experience", payload });

    // The median must render as a real amount, and the tooltip must not be all N/A.
    expect(screen.queryByText("N/A")).toBeNull();
    expect(screen.getByText(/4[.,]?2/)).toBeTruthy();
  });

  it("shows the five-number summary for the experience BOX PLOT chart", () => {
    const datum = { experience: 5, min: 2000, q1: 2500, median: 3000, q3: 3500, max: 4000, count: 8 };
    const payload = [{ dataKey: "_whiskerLow", value: 500, payload: datum }];

    renderTooltip({ active: true, label: 5, chartType: "experience-boxplot", payload });

    expect(screen.getByText("charts.tooltips.min")).toBeTruthy();
    expect(screen.getByText("charts.tooltips.q1")).toBeTruthy();
    expect(screen.getByText("charts.tooltips.max")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy(); // count
  });
});
