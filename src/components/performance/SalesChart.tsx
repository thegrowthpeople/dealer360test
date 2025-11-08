import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

interface ChartDataPoint {
  name: string;
  value: number;
  isQuarter?: boolean;
}

interface SalesChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  chartType: "bar" | "line";
  viewMode: "months" | "quarters" | "both";
  total: number;
}

const MONTH_ABBREVIATIONS: Record<string, string> = {
  Jan: "Jan",
  Feb: "Feb",
  Mar: "Mar",
  Apr: "Apr",
  May: "May",
  Jun: "Jun",
  Jul: "Jul",
  Aug: "Aug",
  Sep: "Sep",
  Oct: "Oct",
  Nov: "Nov",
  Dec: "Dec",
};

const CustomXAxisTick = ({ x, y, payload, viewMode }: any) => {
  const isQuarter = payload.value.startsWith("Q");
  
  // Always show month labels, hide quarters in non-"both" views
  if (viewMode !== "both" && isQuarter) {
    return null;
  }
  
  // In "both" view, show both months and quarters
  const label = MONTH_ABBREVIATIONS[payload.value] || payload.value;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#666"
        fontSize={isQuarter ? 11 : 10}
        fontWeight={isQuarter ? "bold" : "normal"}
      >
        {label}
      </text>
    </g>
  );
};

const CustomLabel = ({ x, y, width, value, isQuarter, viewBox }: any) => {
  if (value === 0 || value === null || value === undefined || isNaN(value)) return null;
  
  // For line charts, x is the center point; for bar charts, we calculate center
  const xPos = width !== undefined ? x + width / 2 : x;
  const yPos = y !== undefined ? y - 10 : (viewBox?.y || 0) - 10;
  
  return (
    <text
      x={xPos}
      y={yPos}
      fill="#666"
      textAnchor="middle"
      fontSize={12}
      fontWeight={isQuarter ? "bold" : "normal"}
    >
      {value}
    </text>
  );
};

export const SalesChart = ({ title, data, color, chartType, viewMode, total }: SalesChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {title} - Total: {total}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === "bar" ? (
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                tick={(props) => <CustomXAxisTick {...props} viewMode={viewMode} />}
                interval={0}
                padding={{ left: 20, right: 20 }}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isQuarter ? "#000000" : color}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  content={(props) => (
                    <CustomLabel {...props} isQuarter={data[props.index]?.isQuarter} />
                  )}
                />
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis
                dataKey="name"
                tick={(props) => <CustomXAxisTick {...props} viewMode={viewMode} />}
                interval={0}
                padding={{ left: 20, right: 20 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="value"
                  content={(props) => (
                    <CustomLabel {...props} isQuarter={data[props.index]?.isQuarter} />
                  )}
                />
              </Line>
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
