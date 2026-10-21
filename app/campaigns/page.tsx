import CampaignsView from "@/components/campaigns-view";
import dashboard from "@/public/data/dashboard.json";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-static";

export default function CampaignsPage() {
  return <CampaignsView data={dashboard as unknown as DashboardData} />;
}
