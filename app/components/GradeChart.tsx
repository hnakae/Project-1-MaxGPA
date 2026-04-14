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
        backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'], // Green, Blue, Yellow, Red
      },
    ],
  };

  return <Bar data={data} options={{ responsive: true }} />;
}