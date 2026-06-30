import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";

const Analytics = () => {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track usage and performance across your knowledge bases
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Queries"
            value="12,847"
            icon={MessageSquare}
            trend={{ value: 18, isPositive: true }}
          />
          <StatsCard
            title="Unique Users"
            value="342"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Avg. Response Time"
            value="1.2s"
            icon={Clock}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Satisfaction Rate"
            value="94%"
            icon={TrendingUp}
            trend={{ value: 3, isPositive: true }}
          />
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Query Volume</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Analytics charts coming soon...</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
