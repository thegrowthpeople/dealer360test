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

const CustomBarLabel = (props: any) => {
  const { x, y, width, value, index, data } = props;
  
  console.log("Bar Label:", { index, value, x, y, width, hasData: !!data });
  
  if (value === null || value === undefined) {
    console.log("Bar label null/undefined for index:", index);
    return null;
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    console.log("Bar label NaN for index:", index, "value:", value);
    return null;
  }
  
  const isQuarter = data?.[index]?.isQuarter || false;
  
  return (
    <text
      x={x + width / 2}
      y={y - 10}
      fill="#666"
      textAnchor="middle"
      fontSize={12}
      fontWeight={isQuarter ? "bold" : "normal"}
    >
      {numValue}
    </text>
  );
};

const CustomLineLabel = (props: any) => {
  const { x, y, value, index, data } = props;
  
  console.log("Line Label:", { index, value, x, y, hasData: !!data });
  
  if (value === null || value === undefined) {
    console.log("Line label null/undefined for index:", index);
    return null;
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    console.log("Line label NaN for index:", index, "value:", value);
    return null;
  }
  
  const isQuarter = data?.[index]?.isQuarter || false;
  
  return (
    <text
      x={x}
      y={y - 10}
      fill="#666"
      textAnchor="middle"
      fontSize={12}
      fontWeight={isQuarter ? "bold" : "normal"}
    >
      {numValue}
    </text>
  );
};

export const SalesChart = ({ title, data, color, chartType, viewMode, total }: SalesChartProps) => {
  console.log(`${title} chart data:`, data);
  
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
                  position="top"
                  content={(props) => <CustomBarLabel {...props} data={data} />}
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
                  position="top"
                  content={(props) => <CustomLineLabel {...props} data={data} />}
                />
              </Line>
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
