import { Search } from "lucide-react";

interface TopbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userEmail?: string;
  userName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  setSearchQuery,
  userEmail,
  userName,
}) => {
  const avatarText =
    userName?.slice(0, 2).toUpperCase() ||
    userEmail?.slice(0, 2).toUpperCase() ||
    "US";

  return (
    <div className="h-[76px] border-b-2 border-db-border px-8 flex items-center justify-between flex-shrink-0">
      {/* Logo */}
      <span className="text-[1.5rem] font-extrabold tracking-[1.5px] text-db-text font-sans uppercase">
        SCRAPBOOK2D
      </span>

      {/* Search */}
      <div className="flex items-center relative w-[380px]">
        <Search size={18} className="absolute left-4 text-db-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search for memories, titles..."
          className="w-full h-[42px] rounded-full border-[1.5px] border-db-border bg-db-card pl-11 pr-4 text-[0.9rem] text-db-text outline-none transition-all duration-200 focus:border-db-text focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] font-sans"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-full bg-[#cbd0d6] border-2 border-db-border flex items-center justify-center font-bold text-[0.9rem] text-db-text overflow-hidden"
          title={userEmail}
        >
          {avatarText}
        </div>
      </div>
    </div>
  );
};
