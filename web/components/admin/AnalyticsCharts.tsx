"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GOLD = "#c9a876";
const GOLD_DIM = "#8a7452";
const TEXT_DIM = "#9c9a96";
const GRID_LINE = "rgba(245, 244, 242, 0.09)";

function formatShortDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SignupPoint {
  date: string;
  count: number;
}

function SignupsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="admin-chart-tooltip">
      <span className="admin-chart-tooltip-label">
        {formatShortDate(label)}
      </span>
      <span className="admin-chart-tooltip-value">
        {payload[0].value.toLocaleString()} signups
      </span>
    </div>
  );
}

export function SignupsChart({ data }: { data: SignupPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID_LINE} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fill: TEXT_DIM, fontSize: 11 }}
          axisLine={{ stroke: GRID_LINE }}
          tickLine={false}
          interval={Math.max(0, Math.ceil(data.length / 6) - 1)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: TEXT_DIM, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<SignupsTooltip />} cursor={{ stroke: GOLD_DIM }} />
        <Line
          type="monotone"
          dataKey="count"
          name="signups"
          stroke={GOLD}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: GOLD }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface GenrePoint {
  genre: string;
  viewerCount: number;
}

function GenreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: GenrePoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="admin-chart-tooltip">
      <span className="admin-chart-tooltip-label">{point.payload.genre}</span>
      <span className="admin-chart-tooltip-value">
        {point.value.toLocaleString()} viewers
      </span>
    </div>
  );
}

export function GenreChart({ data }: { data: GenrePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID_LINE} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: TEXT_DIM, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="genre"
          tick={{ fill: TEXT_DIM, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          content={<GenreTooltip />}
          cursor={{ fill: "rgba(245, 244, 242, 0.04)" }}
        />
        <Bar
          dataKey="viewerCount"
          fill={GOLD}
          radius={[0, 3, 3, 0]}
          barSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
