import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookComponentMarquee } from "../components/BookScroller";
import { BookComponent } from "../components/BookComponent";
import { pb } from "../lib/pocketbase";
import type { PageRecord } from "../types/BookComponentTypes";
import "../styles/dashboard.css";
import "../styles/scrapbook.css";
import {
  Home,
  Upload,
  BookOpen,
  Settings,
  Tag,
  LogOut,
  Search,
  Mail,
  Bell,
  Play,
  X,
  Heart
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "upload">("home");
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate("/");
      return;
    }
    loadPages();
  }, [navigate]);

  const loadPages = async () => {
    try {
      const records = await pb.collection("pages").getFullList<PageRecord>({
        sort: "book,order",
        requestKey: null,
      });
      setPages(records);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Failed to load pages", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("youtubeAccessToken");
    if (!token) {
      alert("Missing YouTube access token. Please log out and log in again.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Preparing upload...");
      console.log("Token: upload started");

      const metadata = {
        snippet: {
          title: file.name,
          description: "Uploaded via Scrapbook App",
          tags: ["scrapbook"],
          categoryId: "22",
        },
        status: {
          privacyStatus: "unlisted",
        },
      };

      setUploadProgress("Initiating YouTube upload session...");

      const sessionResponse = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify(metadata),
        },
      );

      if (!sessionResponse.ok) {
        throw new Error(
          "Failed to initiate YouTube upload session: " +
            (await sessionResponse.text()),
        );
      }

      const uploadUrl = sessionResponse.headers.get("Location");
      if (!uploadUrl) {
        throw new Error(
          "Location header not found in the upload session response.",
        );
      }

      setUploadProgress("Uploading to YouTube...");

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "video/mp4",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          "YouTube upload failed: " + (await uploadResponse.text()),
        );
      }

      const data = await uploadResponse.json();
      const youtubeId = data.id;

      setUploadProgress("Saving to notebook...");

      await pb.collection("pages").create({
        title: file.name,
        youtubeId: youtubeId,
        user: pb.authStore.model?.id,
      });

      setUploadProgress("Upload complete!");
      setTimeout(() => setUploadProgress(""), 2000);
      loadPages();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error uploading video.");
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    localStorage.removeItem("youtubeAccessToken");
    navigate("/");
  };

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-viewport">
      <div className="dashboard-app">
        {/* --- Navigation Sidebar --- */}
        <div className="dashboard-sidebar">
          <div className="sidebar-nav-group">
            <div className="sidebar-logo" onClick={() => setActiveTab("home")}>
              S
            </div>
            
            <button
              className={`sidebar-btn ${activeTab === "home" ? "active" : ""}`}
              onClick={() => setActiveTab("home")}
              title="Dashboard"
            >
              <Home size={20} />
            </button>
            
            <button
              className={`sidebar-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
              title="Upload Memory"
            >
              <Upload size={20} />
            </button>
            
            <button className="sidebar-btn" title="Memories Grid" onClick={() => setActiveTab("home")}>
              <BookOpen size={20} />
            </button>
            
            <button className="sidebar-btn" title="Categories">
              <Tag size={20} />
            </button>

            <button className="sidebar-btn" title="Settings">
              <Settings size={20} />
            </button>
          </div>

          <button
            className="sidebar-btn sidebar-btn-bottom"
            onClick={logout}
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* --- Main Area --- */}
        <div className="dashboard-main">
          {/* Topbar */}
          <div className="dashboard-topbar">
            <div className="topbar-logo">SCRAPBOOK2D</div>
            
            <div className="topbar-search-container">
              <Search size={18} className="topbar-search-icon" />
              <input
                type="text"
                placeholder="Search for memories, titles..."
                className="topbar-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="topbar-actions">
              <button className="topbar-icon-btn" title="Messages">
                <Mail size={18} />
              </button>
              <button className="topbar-icon-btn" title="Notifications">
                <Bell size={18} />
              </button>
              <div className="topbar-avatar" title={pb.authStore.model?.email}>
                {pb.authStore.model?.name?.slice(0, 2).toUpperCase() || 
                 pb.authStore.model?.email?.slice(0, 2).toUpperCase() || 
                 "US"}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "upload" ? (
            <div className="upload-tab-container">
              <div className="upload-paper-wrapper">
                <div className="notebook-paper">
                  <h2 style={{ marginTop: 0 }}>Add New Memories</h2>
                  <p>Welcome, {pb.authStore.model?.name || pb.authStore.model?.email}!</p>
                  <p>
                    Select a video file to upload directly to YouTube. Once completed, 
                    the moment will be automatically cataloged and linked as a playable page.
                  </p>

                  <div
                    style={{
                      marginTop: "40px",
                      padding: "40px 20px",
                      border: "2px dashed var(--accent)",
                      borderRadius: "12px",
                      textAlign: "center",
                      backgroundColor: "rgba(190, 74, 42, 0.03)"
                    }}
                  >
                    <label
                      className="btn-stamp"
                      style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
                    >
                      {isUploading ? uploadProgress : "Choose Video to Upload"}
                      <input
                        type="file"
                        accept="video/*"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard-content-body">
              {/* Left Column: Featured Player */}
              <div className="dashboard-player-column">
                <div className="player-book-container">
                  {/* Render the original BookComponent with hover animation */}
                  <BookComponent />
                </div>

                <div className="player-book-info">
                  <div className="player-title-row">
                    <h2 className="player-book-title" style={{ fontSize: "1.8rem" }}>
                      Featured Album
                    </h2>
                    <div className="player-favorites-badge">
                      <Heart size={14} fill="var(--db-accent-color)" stroke="var(--db-accent-color)" />
                      <span>{12 + (pages.length * 3)}</span>
                    </div>
                  </div>
                  <div className="player-book-subtitle" style={{ fontSize: "0.75rem", padding: "2px 6px" }}>
                    Hover book to flip pages
                  </div>

                  {/* Waveform Progress Visualizer */}
                  <div className="player-progress-section" style={{ marginTop: "8px", marginBottom: "12px" }}>
                    <span className="progress-time">01:00</span>
                    <div className="player-waveform-container">
                      {Array.from({ length: 24 }).map((_, idx) => {
                        const isActive = idx < 12;
                        const heights = [16, 24, 32, 28, 20, 24, 28, 16, 20, 32, 24, 28, 16, 20, 32, 28, 24, 20, 16, 24, 32, 28, 20, 24];
                        const height = heights[idx % heights.length];
                        return (
                          <div
                            key={idx}
                            className={`waveform-bar ${isActive ? "active" : ""}`}
                            style={{ height: `${height}px` }}
                          />
                        );
                      })}
                    </div>
                    <span className="progress-time">03:35</span>
                  </div>

                  {/* Visual info showing instructions */}
                  <div style={{ fontSize: "0.85rem", color: "var(--db-text-secondary)", textAlign: "center", fontStyle: "italic" }}>
                    Hover book to watch it swing open and turn pages!
                  </div>
                </div>
              </div>

              {/* Right Column: Library & Playlist */}
              <div className="dashboard-content-column">
                {/* Book Carousel Section using original BookComponentMarquee */}
                <div className="categories-shelf-container" style={{ maxHeight: "290px", overflow: "hidden" }}>
                  <div className="shelf-title-row">
                    <h3 className="shelf-title">Memory Shelf</h3>
                  </div>
                  
                  <div style={{ marginTop: "-20px" }}>
                    <BookComponentMarquee />
                  </div>
                </div>

                {/* Playlist section */}
                <div className="playlist-section-container">
                  <h3 className="playlist-section-title">
                    Favorite Memories ({filteredPages.length})
                  </h3>

                  <div className="playlist-items-list scrollbar-hide">
                    {filteredPages.map((page, idx) => (
                      <div
                        key={page.id}
                        className="playlist-item-card"
                        onClick={() => setPlayingVideoId(page.youtubeId)}
                      >
                        <div className="playlist-item-left">
                          <div className="playlist-item-thumb">
                            <img
                              src={`https://img.youtube.com/vi/${page.youtubeId}/0.jpg`}
                              alt={page.title}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <BookOpen size={16} style={{ color: "var(--db-text-secondary)" }} />
                          </div>
                          
                          <div className="playlist-item-details">
                            <span className="playlist-item-title">{page.title}</span>
                            <span className="playlist-item-desc">
                              Page {idx + 1} • Linked to YouTube
                            </span>
                          </div>
                        </div>

                        <button
                          className="playlist-item-play-btn"
                          title="Play Moment"
                        >
                          <Play size={14} fill="currentColor" style={{ marginLeft: "1px" }} />
                        </button>
                      </div>
                    ))}

                    {filteredPages.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "var(--db-text-secondary)",
                          fontFamily: "'Caveat', cursive",
                          fontSize: "1.4rem",
                        }}
                      >
                        No active moments found...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Video Modal Player Overlay --- */}
      {playingVideoId && (
        <div className="modal-backdrop" onClick={() => setPlayingVideoId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPlayingVideoId(null)}>
              <X size={16} />
            </button>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
