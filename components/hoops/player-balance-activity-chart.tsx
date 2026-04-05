'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { BalanceChartPoint } from '@/lib/player-monthly-fees'

export type { BalanceChartPoint }

export function PlayerBalanceActivityChart({ data }: { data: BalanceChartPoint[] }) {
  const hasAny = data.some((d) => d.amountPence > 0)
  if (!hasAny) return null

  const chartData = data.map((d) => ({
    ...d,
    pounds: d.amountPence / 100,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <p className="text-xs font-medium text-gray-500 mb-3">Session fees by month (last 6)</p>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="playerFeeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `£${v}`}
              width={40}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number'
                  ? [formatCurrency(Math.round(value * 100)), 'Fees']
                  : ['', '']
              }
              labelClassName="text-gray-700"
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="pounds"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#playerFeeFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
