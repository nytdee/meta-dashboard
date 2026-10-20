import Dashboard from "@/components/dashboard";
import dashboard from "@/public/data/dashboard.json";
import type { DashboardData } from "@/lib/types";

export default function Home() {
  return <Dashboard data={dashboard as unknown as DashboardData} />;
}
