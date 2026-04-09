import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex w-full dark">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar threatDetected={true} />
        <main className="flex-1 overflow-auto p-6 scrollbar-cyber">
          {children}
        </main>
      </div>
    </div>
  );
}
