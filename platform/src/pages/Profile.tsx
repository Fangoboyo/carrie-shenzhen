import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../lib/pocketbase";
import type { PageRecord, BookRecord } from "../types/BookComponentTypes";

import { Sidebar }         from "../components/profile/Sidebar";
import { Topbar }          from "../components/profile/Topbar";
import { UploadTab }       from "../components/profile/UploadTab";
import { SelectedBook }    from "../components/profile/SelectedBook";
import { MemoryShelf }     from "../components/profile/MemoryShelf";
import { PageListSection } from "../components/profile/PagesList";
import { VideoModal }      from "../components/profile/VideoModal";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "upload">("home");
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) { navigate("/"); return; }
    loadPages();
    loadBooks();
  }, [navigate]);

  const loadBooks = async () => {
    try {
      const records = await pb.collection("books").getFullList<BookRecord>({
        sort: "-created", requestKey: null,
      });
      setBooks(records);
      if (records.length > 0) setSelectedBookId(records[0].id);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Failed to load books", err);
    }
  };

  const loadPages = async () => {
    try {
      const records = await pb.collection("pages").getFullList<PageRecord>({
        sort: "book,order", requestKey: null,
      });
      setPages(records);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Failed to load pages", err);
    }
  };

  const handleCreateBook = async (payload: {
    title: string; subtitle: string; coverFile: File | null;
  }) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.subtitle) formData.append("subtitle", payload.subtitle);
    if (payload.coverFile) formData.append("cover", payload.coverFile);
    formData.append("owner", pb.authStore.model?.id ?? "");

    setIsUploading(true);
    setUploadProgress("Creating book…");
    try {
      await pb.collection("books").create(formData);
      setUploadProgress("Book created!");
      setTimeout(() => setUploadProgress(""), 2000);
      loadBooks();
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Failed to create book.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePageUpload = async (payload: {
    videoFile: File; title: string; description: string; bookId: string; order: string;
  }) => {
    const token = localStorage.getItem("youtubeAccessToken");
    if (!token) throw new Error("Missing YouTube access token. Please log out and log in again.");

    setIsUploading(true);
    try {
      setUploadProgress("Preparing upload…");

      const metadata = {
        snippet: {
          title: payload.title,
          description: payload.description || "Uploaded via Scrapbook App",
          tags: ["scrapbook"],
          categoryId: "22",
        },
        status: { privacyStatus: "unlisted" },
      };

      setUploadProgress("Initiating YouTube upload session…");
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
        throw new Error("Failed to initiate YouTube upload session: " + (await sessionResponse.text()));
      }

      const uploadUrl = sessionResponse.headers.get("Location");
      if (!uploadUrl) throw new Error("Location header not found in the upload session response.");

      setUploadProgress("Uploading to YouTube…");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": payload.videoFile.type || "video/mp4" },
        body: payload.videoFile,
      });

      if (!uploadResponse.ok) throw new Error("YouTube upload failed: " + (await uploadResponse.text()));

      const data = await uploadResponse.json();
      const youtubeId = data.id;

      setUploadProgress("Saving to notebook…");
      const pageData: Record<string, any> = {
        title: payload.title, youtubeId, user: pb.authStore.model?.id,
      };
      if (payload.description) pageData.description = payload.description;
      if (payload.bookId) {
        pageData.book = payload.bookId;
        if (payload.order !== "") pageData.order = parseInt(payload.order, 10);
      }

      await pb.collection("pages").create(pageData);
      setUploadProgress("Upload complete!");
      setTimeout(() => setUploadProgress(""), 2000);
      loadPages();
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Error uploading video.");
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
    page.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;

  // Pages are flat-fetched; filter in-memory per canonical pattern in AI_MEMORY.md
  const selectedBookPages = pages
    .filter((p) => p.book === selectedBookId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    /* Viewport: beige grid-dot background */
    <div className="min-h-screen bg-db-bg-dark bg-grid-dots flex justify-center items-center p-6 box-border">

      {/* App shell */}
      <div className="w-full max-w-[1280px] h-[860px] bg-db-app-bg border-2 border-db-border rounded-[28px] shadow-[0_15px_35px_rgba(43,39,35,0.15),0_5px_15px_rgba(43,39,35,0.1)] flex overflow-hidden relative">

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userEmail={pb.authStore.model?.email}
            userName={pb.authStore.model?.name}
          />

          {activeTab === "upload" ? (
            <UploadTab
              books={books}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onCreateBook={handleCreateBook}
              onPageUpload={handlePageUpload}
              userEmail={pb.authStore.model?.email}
              userName={pb.authStore.model?.name}
            />
          ) : (
            /* Content body: player + right column */
            <div className="flex-1 flex p-6 gap-6 overflow-hidden">
              <SelectedBook
                book={selectedBook}
                pages={selectedBookPages}
                currentPageIndex={currentPageIndex}
                onPageChange={setCurrentPageIndex}
              />

              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <MemoryShelf
                  books={books}
                  pages={pages}
                  selectedBookId={selectedBookId}
                  onBookClick={(bookId) => {
                    setSelectedBookId(bookId);
                    setCurrentPageIndex(0);
                  }}
                />
                <PageListSection
                  filteredPages={filteredPages}
                  onPlay={setPlayingVideoId}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <VideoModal playingVideoId={playingVideoId} onClose={() => setPlayingVideoId(null)} />
    </div>
  );
}
