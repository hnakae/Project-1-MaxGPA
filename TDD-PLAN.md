<!-- test driven development -->

## Design System v2 — Visual Regression Tests

```ts
// app/components/__tests__/design-system.test.tsx
import { render } from "@testing-library/react";
import { KpiCard } from "../kpi-card";
import { CourseCard } from "../course-card";

describe("KpiCard", () => {
  it("renders value in forest-900 color class", () => {
    const { container } = render(
      <KpiCard title="Average GPA" value="3.24" subtitle="Across 4 courses" />
    );
    const value = container.querySelector(".text-forest-900");
    expect(value).toBeTruthy();
    expect(value?.textContent).toBe("3.24");
  });
});

describe("CourseCard recommendation badges", () => {
  const baseProps = {
    code: "CS 210",
    name: "Computer Science I",
    instructorRating: 4.5,
    gradeData: [{ grade: "A", count: 100, percentage: 80 }],
  };

  it("shows Seek badge for avgGpa > 3.5", () => {
    const { getByText } = render(<CourseCard {...baseProps} avgGpa={3.72} />);
    expect(getByText("Seek")).toBeTruthy();
  });

  it("shows Avoid badge for avgGpa < 2.5", () => {
    const { getByText } = render(<CourseCard {...baseProps} avgGpa={2.1} />);
    expect(getByText("Avoid")).toBeTruthy();
  });

  it("shows Neutral badge for avgGpa between 2.5 and 3.5", () => {
    const { getByText } = render(<CourseCard {...baseProps} avgGpa={3.0} />);
    expect(getByText("Neutral")).toBeTruthy();
  });
});
```
