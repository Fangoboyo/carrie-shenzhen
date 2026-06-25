import React from "react";
import { Home, Upload, LogOut } from "lucide-react";

interface SidebarProps {
  activeTab: "home" | "upload";
  setActiveTab: (tab: "home" | "upload") => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const btnBase =
    "w-12 h-12 rounded-[14px] border-none flex items-center justify-center cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]";
  const btnIdle =
    "bg-transparent text-db-muted hover:text-db-text hover:bg-black/5 hover:-translate-y-0.5";
  const btnActive =
    "bg-db-accent text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]";

  const NavBtn = ({
    tab,
    icon,
    title,
  }: {
    tab?: "home" | "upload";
    icon: React.ReactNode;
    title: string;
  }) => (
    <button
      className={`${btnBase} ${tab && activeTab === tab ? btnActive : btnIdle}`}
      onClick={() => tab && setActiveTab(tab)}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="w-20 bg-db-sidebar border-r-2 border-db-border flex flex-col items-center py-6 justify-between flex-shrink-0">
      <div className="flex flex-col gap-4 items-center w-full">
        {/* Logo */}
        <button
          className="text-[1.8rem] font-bold font-hand text-db-text mb-6 cursor-pointer border-none bg-transparent transition-transform duration-200 hover:scale-110 hover:-rotate-6"
          onClick={() => setActiveTab("home")}
        >
          S
        </button>

        <NavBtn tab="home"   icon={<Home size={20} />}     title="Dashboard" />
        <NavBtn tab="upload" icon={<Upload size={20} />}   title="Upload Memory" />
      </div>

      <button
        className={`${btnBase} ${btnIdle} mt-auto`}
        onClick={onLogout}
        title="Log Out"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};
