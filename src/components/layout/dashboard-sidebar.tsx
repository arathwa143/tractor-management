"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, CalendarDays, Tractor, 
  Fuel, Wrench, Package, UsersRound, BookOpen, 
  Wallet, BarChart3, Settings, LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Bookings", href: "/bookings", icon: CalendarDays },
  { name: "Jobs", href: "/jobs", icon: Tractor },
  { name: "Diesel", href: "/diesel", icon: Fuel },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Drivers", href: "/drivers", icon: UsersRound },
  { name: "Cashbook", href: "/cashbook", icon: BookOpen },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Tractor className="h-6 w-6" />
          TractorPro
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Farm Operations</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md w-full transition-colors">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}