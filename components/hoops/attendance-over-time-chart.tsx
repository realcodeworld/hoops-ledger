"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { DashboardAttendancePoint } from "@/lib/actions/dashboard"

const STROKE = "#F97316"

type Props = {
  data: DashboardAttendancePoint[]
}

export function AttendanceOverTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        Session attendance will appear here once you have scheduled sessions.
      </p>
    )
  }

  return (
    <div className="w-full h-[min(22rem,55vw)] min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            width={36}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.875rem",
            }}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as DashboardAttendancePoint | undefined
              if (!row?.startsAt) return ""
              try {
                return new Date(row.startsAt).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              } catch {
                return row.label
              }
            }}
            formatter={(value) => [`${value} players`, "Attendance"]}
          />
          <Line
            type="monotone"
            dataKey="attendees"
            name="Attendance"
            stroke={STROKE}
            strokeWidth={2}
            dot={{ r: 3, fill: STROKE, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: STROKE }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
