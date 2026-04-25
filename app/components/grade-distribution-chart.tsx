import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GradeData {
  grade: string;
  count: number;
  percentage: number;
  fill?: string;
}

interface GradeDistributionChartProps {
  data: GradeData[];
  courseId?: string;
}

const GRADE_COLORS = {
  A: "#10b981", // emerald-500
  B: "#34d399", // emerald-400 (lighter green)
  C: "#f59e0b", // amber-500
  DNF: "#ef4444", // red-500
};

export function GradeDistributionChart({ data, courseId = 'default' }: GradeDistributionChartProps) {
  // Add fill color to each data point with unique identifiers
  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: GRADE_COLORS[item.grade as keyof typeof GRADE_COLORS] || "#94a3b8",
    id: `${courseId}-${item.grade}-${index}`
  }));

  return (
    <ResponsiveContainer width="100%" height={220} key={`container-${courseId}`}>
      <BarChart 
        data={dataWithColors} 
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        id={`chart-${courseId}`}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" key={`grid-${courseId}`} />
        <XAxis 
          dataKey="grade" 
          tick={{ fill: "#64748b", fontSize: 12 }} 
          key={`xaxis-${courseId}`}
          label={{ value: "Grade", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: "#64748b", fontSize: 12 }} 
          key={`yaxis-${courseId}`}
          label={{ value: "Percentage (%)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
          }}
          key={`tooltip-${courseId}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => {
            if (name === "percentage") return [`${value}%`, "Percentage"];
            return [value, name ?? ""];
          }}
        />
        <Bar dataKey="percentage" radius={[6, 6, 0, 0]} id={`bar-${courseId}`} key={`bar-${courseId}`} />
      </BarChart>
    </ResponsiveContainer>
  );
}
