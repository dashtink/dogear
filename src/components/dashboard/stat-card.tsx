import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label:    string;
  value:    number;
  icon:     LucideIcon;
  color?:   "default" | "orange" | "red" | "green";
}

export function StatCard({ label, value, icon: Icon, color = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            color === "default" && "bg-primary/10 text-primary",
            color === "orange"  && "bg-orange-100 text-orange-600",
            color === "red"     && "bg-red-100 text-red-600",
            color === "green"   && "bg-green-100 text-green-600",
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
