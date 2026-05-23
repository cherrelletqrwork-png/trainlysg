import { BottomTabs } from "@/components/app/bottom-tabs";
import { InstallPrompt } from "@/components/app/install-prompt";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Content area — padded at the bottom so it doesn't sit under the tab bar */}
      <div
        className="flex-1 pb-[88px]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        {children}
      </div>
      <BottomTabs />
      <InstallPrompt />
    </div>
  );
}
