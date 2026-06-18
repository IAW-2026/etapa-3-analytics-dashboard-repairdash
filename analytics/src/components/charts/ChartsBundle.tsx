'use client';
import dynamic from 'next/dynamic';

export const LineChartCard = dynamic(
  () => import('./LineChartCard').then(m => m.LineChartCard),
  { ssr: false }
);
export const BarChartCard = dynamic(
  () => import('./BarChartCard').then(m => m.BarChartCard),
  { ssr: false }
);
export const DonutChartCard = dynamic(
  () => import('./DonutChartCard').then(m => m.DonutChartCard),
  { ssr: false }
);
