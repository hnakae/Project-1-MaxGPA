'use client'
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartData {
  labels: string[];
  data: number[];
}

export default function GradeChart({ chartData }: { chartData: ChartData }) {
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Grade Distribution (%)',
        data: chartData.data,
        backgroundColor: ['#10b981', '#34d399', '#f59e0b', '#ef4444'], // Dark green, light green, yellow, red
      },
    ],
  };

  return <Bar data={data} options={{ responsive: true }} />;
}