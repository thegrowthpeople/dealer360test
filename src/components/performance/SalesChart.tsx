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
import { formatNumber } from "@/lib/utils";

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-foreground font-semibold">{payload[0].payload.name}</p>
        <p className="text-foreground text-lg font-bold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload, viewMode }: any) => {
  const isQuarter = payload.value.startsWith("Q");
  
  // In quarters view, only show quarters
  // In months view, only show months
  // In both view, only show quarters
  if (viewMode === "quarters" && !isQuarter) {
    return null;
  }
  if (viewMode === "months" && isQuarter) {
    return null;
  }
  if (viewMode === "both" && !isQuarter) {
    return null;
  }
  
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

const CustomBar = (props: any, viewMode: string, chartData: any[]) => {
  const { x, y, width, height, index, fill, stroke, strokeWidth } = props;
  
  const isQuarter = chartData?.[index]?.isQuarter || false;
  const isMonthInBothMode = viewMode === "both" && !isQuarter;
  
  // Make month bars 80% of quarter bar width in "both" mode
  const barWidth = isMonthInBothMode ? width * 0.8 : width;
  const barX = isMonthInBothMode ? x + (width - barWidth) / 2 : x;
  
  const radius = 8;
  
  // Create a path for rounded top corners only
  const path = `
    M ${barX},${y + height}
    L ${barX},${y + radius}
    Q ${barX},${y} ${barX + radius},${y}
    L ${barX + barWidth - radius},${y}
    Q ${barX + barWidth},${y} ${barX + barWidth},${y + radius}
    L ${barX + barWidth},${y + height}
    Z
  `;
  
  return (
    <path
      d={path}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{
        transition: 'opacity 0.3s ease, transform 0.2s ease',
      }}
      className="hover:opacity-80"
    />
  );
};

const renderCustomLabel = (props: any, chartData: any[], viewMode: string) => {
  const { x, y, width, height, value, index } = props;
  
  // Skip if no value
  if (value === null || value === undefined) return null;
  
  const numValue = Number(value);
  if (isNaN(numValue)) return null;
  
  const isQuarter = chartData?.[index]?.isQuarter || false;
  
  // In "both" mode, only show labels for quarters (hide month labels)
  if (viewMode === "both" && !isQuarter) return null;
  
  // Calculate position based on whether we have width (bar) or not (line)
  const xPos = width !== undefined ? x + width / 2 : x;
  const yPos = height !== undefined ? y - 10 : y - 10;
  
  return (
    <text
      x={xPos}
      y={yPos}
      fill="#666"
      textAnchor="middle"
      dominantBaseline="auto"
      fontSize={12}
      fontWeight={isQuarter ? "bold" : "normal"}
    >
      {numValue}
    </text>
  );
};

export const SalesChart = ({ title, data, color, chartType, viewMode, total }: SalesChartProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{title}</span>
          <span className="text-2xl font-bold text-foreground">{formatNumber(total)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }} barCategoryGap={2} barGap={2}>
              <XAxis
                dataKey="name"
                tick={(props) => <CustomXAxisTick {...props} viewMode={viewMode} />}
                interval={0}
                padding={{ left: 10, right: 10 }}
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                maxBarSize={120}
                shape={(props) => CustomBar(props, viewMode, data)}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                {data.map((entry, index) => {
                  // In "both" mode: months are white with colored outline, quarters keep solid fill
                  const isMonthInBothMode = viewMode === "both" && !entry.isQuarter;
                  const fillColor = isMonthInBothMode ? "#ffffff" : color;
                  const strokeColor = isMonthInBothMode ? color : undefined;
                  const strokeWidth = isMonthInBothMode ? 2 : 0;
                  
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}
                <LabelList
                  content={(props) => renderCustomLabel(props, data, viewMode)}
                />
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={(props) => <CustomXAxisTick {...props} viewMode={viewMode} />}
                interval={0}
                padding={{ left: 20, right: 20 }}
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                <LabelList
                  content={(props) => renderCustomLabel(props, data, viewMode)}
                />
              </Line>
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
