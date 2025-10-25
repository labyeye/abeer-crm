import React, { ComponentType, SVGProps } from "react";
import AnimatedNumber from "./AnimatedNumber";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "purple"
    | "teal"
    | "pink"
    | "indigo";
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
}) => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.replace(/[^0-9.-]+/g, "") !== ""
      ? Number(value.replace(/[^0-9.-]+/g, ""))
      : NaN;

  const renderValue = () => {
    if (!Number.isNaN(numericValue)) {
      // if original value had a currency symbol, preserve it
      const hasRupee = typeof value === "string" && value.trim().startsWith("₹");
      const prefix = hasRupee ? "₹" : "";
      return (
        <AnimatedNumber value={numericValue} duration={900} prefix={prefix} />
      );
    }
    return <>{value}</>;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover card-animate">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-md font-medium text-gray-500 mb-2">{title}</p>
          <div className="flex flex-row">
            <div className={"rounded-full p-3 bg-white mr-4 border border-gray-200"}>
              <Icon className="w-8 h-8" strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{renderValue()}</p>
          </div>
          {change && <span className="text-xs text-gray-500">{change}</span>}
        </div>
      </div>
    </div>
  );
};
export default StatCard;
