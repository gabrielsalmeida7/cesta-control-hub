
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "primary" | "success" | "danger" | "secondary";
}

const DashboardCard = ({ title, value, icon: Icon, color }: DashboardCardProps) => {
  const colorClasses = {
    primary: "bg-primary text-white",
    success: "bg-success text-white",
    danger: "bg-danger text-white",
    secondary: "bg-secondary text-primary",
  };

  return (
    <Card className="border rounded-lg overflow-hidden shadow-md">
      <div className={`p-4 ${colorClasses[color]}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{title}</h3>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Atualizado hoje
      </CardFooter>
    </Card>
  );
};

export default DashboardCard;
