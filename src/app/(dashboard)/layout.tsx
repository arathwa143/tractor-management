import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { UserCircle } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}