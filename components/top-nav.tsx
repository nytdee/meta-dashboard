"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Layers, Sparkles } from "lucide-react";
import { cn } from "./ui";

const DESTINATIONS = [
  {
    href: "/",
    label: "Overview",
    icon: BarChart3,
    hint: "What needs attention",
  },
  {
    href: "/creative",
    label: "Creative Intelligence",
    icon: Sparkles,
    hint: "Which patterns to repeat",
  },
  {
    href: "/campaigns",
    label: "Campaigns & Ads",
    icon: Layers,
    hint: "Investigate the details",
  },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-4 py-2 lg:px-8">
        {DESTINATIONS.map((destination) => {
          const active =
            destination.href === "/"
              ? pathname === "/"
              : pathname.startsWith(destination.href);
          const Icon = destination.icon;
          return (
            <Link
              key={destination.href}
              href={destination.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {destination.label}
              <span className="hidden text-[10px] font-normal text-muted sm:inline">
                {destination.hint}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
