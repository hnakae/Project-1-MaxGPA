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
  height?: number | `${number}%`;
}

const GRADE_COLORS = {
  A: "#10b981", // emerald-500
  B: "#34d399", // emerald-400 (lighter green)
  C: "#f59e0b", // amber-500
  DNF: "#ef4444", // red-500
};

export function GradeDistributionChart({ data, courseId = 'default', height = 220 }: GradeDistributionChartProps) {
  // Add fill color to each data point with unique identifiers
  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: GRADE_COLORS[item.grade as keyof typeof GRADE_COLORS] || "#94a3b8",
    id: `${courseId}-${item.grade}-${index}`
  }));

  return (
    <ResponsiveContainer width="100%" height={height} key={`container-${courseId}`}>
      <BarChart 
        data={dataWithColors} 
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        id={`chart-${courseId}`}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" key={`grid-${courseId}`} vertical={false} />
        <XAxis 
          dataKey="grade" 
          tick={{ fill: "#64748b", fontSize: 10 }} 
          key={`xaxis-${courseId}`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fill: "#64748b", fontSize: 10 }} 
          key={`yaxis-${courseId}`}
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          width={25}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          key={`tooltip-${courseId}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => {
            if (name === "percentage") return [`${value}%`, "Percentage"];
            return [value, name ?? ""];
          }}
        />
        <Bar dataKey="percentage" radius={[4, 4, 0, 0]} id={`bar-${courseId}`} key={`bar-${courseId}`} />
      </BarChart>
    </ResponsiveContainer>
  );
}
