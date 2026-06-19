import React, { useRef, useState } from "react";
import type { BookRecord } from "../../types/BookComponentTypes";
import { BookCover } from "../book/BookCover";

// ─── Shared Types ──────────────────────────────────────────────────────────

interface BookCreatePayload {
  title: string;
  subtitle: string;
  coverFile: File | null;
}

interface PageUploadPayload {
  videoFile: File;
  title: string;
  description: string;
  bookId: string;
  order: string;
}

interface UploadTabProps {
  books: BookRecord[];
  isUploading: boolean;
  uploadProgress: string;
  userEmail?: string;
  userName?: string;
  onCreateBook: (payload: BookCreatePayload) => Promise<void>;
  onPageUpload: (payload: PageUploadPayload) => Promise<void>;
}

// ─── Shared Input Styles ────────────────────────────────────────────────────

const inputCls =
  "w-full bg-white/70 border-[1.5px] border-db-border rounded-md px-3.5 py-2.5 font-sans text-[0.95rem] text-db-text outline-none box-border transition-[border-color,box-shadow] duration-200 focus:border-db-accent focus:shadow-[0_0_0_3px_rgba(190,74,42,0.1)]";

const labelCls =
  "block font-hand text-[1.3rem] font-bold text-db-text mb-1.5 mt-5 first:mt-0";

// ─── Drop Zone ─────────────────────────────────────────────────────────────

interface DropZoneProps {
  accept: string;
  file: File | null;
  onChange: (file: File) => void;
  icon: string;
  text: string;
  hint: string;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({
  accept, file, onChange, icon, text, hint, disabled,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div
      className={`w-full border-[2.5px] border-dashed rounded-xl px-5 py-8 flex flex-col items-center justify-center gap-2.5 text-center relative box-border transition-all duration-[250ms] ease-in-out
        ${dragOver
          ? "border-db-accent bg-[rgba(190,74,42,0.04)] scale-[1.01] shadow-[0_0_0_4px_rgba(190,74,42,0.08)]"
          : "border-db-border bg-white/50 hover:border-db-accent hover:bg-[rgba(190,74,42,0.04)]"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
          e.target.value = "";
        }}
      />
      <span className="text-[2.4rem] leading-none">{icon}</span>
      {file ? (
        <span className="font-sans text-[0.85rem] font-semibold text-db-accent bg-[rgba(190,74,42,0.08)] px-3 py-1 rounded-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {file.name}
        </span>
      ) : (
        <>
          <p className="font-hand text-[1.35rem] text-db-muted m-0">{text}</p>
          <p className="font-sans text-[0.75rem] text-db-muted opacity-70 m-0">{hint}</p>
        </>
      )}
    </div>
  );
};

// ─── Progress / Status ──────────────────────────────────────────────────────

const ProgressBar: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-5 bg-black/4 rounded-lg px-4 py-3.5 flex items-center gap-3">
    <div className="w-[18px] h-[18px] rounded-full border-[2.5px] border-[rgba(190,74,42,0.2)] border-t-db-accent flex-shrink-0 animate-spin-upload" />
    <span className="font-sans text-[0.9rem] text-db-text font-medium">{message}</span>
  </div>
);

const StatusFlash: React.FC<{ type: "success" | "error"; msg: string }> = ({ type, msg }) => (
  <div
    className={`mt-4 px-4 py-2.5 rounded-lg font-hand text-[1.25rem] text-center animate-fade-slide-in
      ${type === "success"
        ? "bg-[rgba(74,150,74,0.1)] text-[#2e6b2e] border border-[rgba(74,150,74,0.3)]"
        : "bg-[rgba(190,74,42,0.08)] text-db-accent border border-[rgba(190,74,42,0.25)]"
      }`}
  >
    {msg}
  </div>
);

// ─── Book Creation Form ─────────────────────────────────────────────────────

interface BookFormProps {
  books: BookRecord[];
  isUploading: boolean;
  uploadProgress: string;
  onCreateBook: (payload: BookCreatePayload) => Promise<void>;
}

const BookCreationForm: React.FC<BookFormProps> = ({
  isUploading, uploadProgress, onCreateBook,
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleCoverChange = (file: File) => {
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatus({ type: "error", msg: "✏️ Give your book a title first!" });
      return;
    }
    setStatus(null);
    try {
      await onCreateBook({ title: title.trim(), subtitle: subtitle.trim(), coverFile });
      setStatus({ type: "success", msg: "📖 Book bound and shelved!" });
      setTitle(""); setSubtitle(""); setCoverFile(null); setCoverPreviewUrl(undefined);
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Something went wrong." });
    }
  };

  const coverRef = useRef<HTMLDivElement | null>(null);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className={labelCls}>Cover Image</label>
      <DropZone
        accept="image/jpeg,image/png,image/webp"
        file={coverFile}
        onChange={handleCoverChange}
        icon="🖼️"
        text="Drop a cover image here"
        hint="JPEG / PNG / WebP · max 5 MB"
        disabled={isUploading}
      />

      {/* book preview */}
      <div className="flex justify-center py-4">
        <div className="relative w-[150px] h-[210px]">
          <BookCover
            coverRef={coverRef}
            displayCoverUrl={coverPreviewUrl}
            displayTitle={title || "Untitled Book"}
            displaySubtitle={subtitle}
          />
        </div>
      </div>

      

      <hr className="border-none border-t-[1.5px] border-dashed border-black/12 my-6" />

      <label htmlFor="book-title" className={labelCls}>Book Title *</label>
      <input id="book-title" type="text" className={inputCls}
        placeholder="e.g. Summer in Shenzhen" value={title}
        onChange={(e) => setTitle(e.target.value)} disabled={isUploading} maxLength={100} />

      <label htmlFor="book-subtitle" className={labelCls}>
        Subtitle <span className="font-sans font-normal text-[1rem] opacity-60">(optional)</span>
      </label>
      <input id="book-subtitle" type="text" className={inputCls}
        placeholder="e.g. A collection of warm evenings" value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)} disabled={isUploading} maxLength={120} />

      {isUploading && uploadProgress && <ProgressBar message={uploadProgress} />}
      {status && !isUploading && <StatusFlash {...status} />}

      <button
        type="submit"
        id="bind-book-btn"
        disabled={isUploading}
        className="mt-8 w-full font-hand text-[1.55rem] font-bold text-db-accent bg-transparent border-[3px] border-db-accent rounded-md px-8 py-2.5 uppercase cursor-pointer -rotate-[1.5deg] tracking-[0.5px] transition-all duration-200 hover:enabled:bg-db-accent hover:enabled:text-white hover:enabled:rotate-0 hover:enabled:scale-[1.02] hover:enabled:shadow-[0_4px_12px_rgba(190,74,42,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Binding…" : "Bind This Book 📖"}
      </button>
    </form>
  );
};

interface UsbFormProps {
  books: BookRecord[];
  isUploading: boolean;
  uploadProgress: string;
  onPageUpload: (payload: PageUploadPayload) => Promise<void>;
}

const UsbUploadForm: React.FC<UsbFormProps> = ({
  books, isUploading, uploadProgress, onPageUpload,
}) => {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [detectedFiles, setDetectedFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Plug in your USB drive and select the directory to import memories.");
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "uploading" | "success" | "error">>({});
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string | null>(null);

  // Set initial selected book if none selected
  React.useEffect(() => {
    if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  const handleScanUSB = async () => {
    setIsScanning(true);
    setStatusMessage("Scanning USB drive for video files...");
    setDetectedFiles([]);
    setUploadStatus({});

    try {
      // Check if showDirectoryPicker is supported in the browser
      if ("showDirectoryPicker" in window) {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];

        // Recursive helper to traverse directories
        async function traverseDirectory(handle: any) {
          for await (const entry of handle.values()) {
            if (entry.kind === "file") {
              const file = await entry.getFile();
              const ext = file.name.split(".").pop()?.toLowerCase();
              // Filter for video extensions
              if (ext && ["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(ext)) {
                files.push(file);
              }
            } else if (entry.kind === "directory") {
              await traverseDirectory(entry);
            }
          }
        }

        await traverseDirectory(directoryHandle);

        if (files.length === 0) {
          setStatusMessage("USB scan complete. No video files found in the selected folder.");
        } else {
          setDetectedFiles(files);
          setStatusMessage(`USB scan complete! Found ${files.length} video files.`);
          
          const initialStatus: Record<string, "pending"> = {};
          files.forEach(f => {
            initialStatus[f.name] = "pending";
          });
          setUploadStatus(initialStatus);
        }
      } else {
        // Fallback simulation for unsupported browsers (like Firefox or Safari, or for demo convenience)
        setStatusMessage("Direct directory scan not fully supported by this browser. Simulating USB mount...");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Create mock File objects representing detected videos
        const mockVideos = [
          new File(["mock content 1"], "Shenzhen_Bay_Sunset.mp4", { type: "video/mp4" }),
          new File(["mock content 2"], "Family_Dinner_Shenzhen.mp4", { type: "video/mp4" }),
          new File(["mock content 3"], "Nanshan_Highways.mov", { type: "video/quicktime" }),
        ];

        setDetectedFiles(mockVideos);
        setStatusMessage("Simulated USB Drive detected! Mount success. Found 3 video files.");

        const initialStatus: Record<string, "pending"> = {};
        mockVideos.forEach(f => {
          initialStatus[f.name] = "pending";
        });
        setUploadStatus(initialStatus);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage("Scan cancelled or failed. Please select a valid directory.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportUSB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      alert("Please select a book first!");
      return;
    }
    if (detectedFiles.length === 0) {
      alert("No video payloads found to upload. Scan a USB directory first.");
      return;
    }

    setStatusMessage("Starting batch import from USB...");

    for (let i = 0; i < detectedFiles.length; i++) {
      const file = detectedFiles[i];
      
      // Update status to uploading
      setUploadStatus(prev => ({ ...prev, [file.name]: "uploading" }));
      setCurrentUploadingFile(file.name);

      // Construct a clean title from the filename (replace underscores and dashes with spaces, strip extension)
      const cleanTitle = file.name
        .substring(0, file.name.lastIndexOf("."))
        .replace(/_/g, " ")
        .replace(/-/g, " ");

      try {
        await onPageUpload({
          videoFile: file,
          title: cleanTitle,
          description: "Uploaded automatically from USB payload.",
          bookId: selectedBookId,
          order: "", // Append to end
        });
        setUploadStatus(prev => ({ ...prev, [file.name]: "success" }));
      } catch (err) {
        console.error(`Failed to upload ${file.name}`, err);
        setUploadStatus(prev => ({ ...prev, [file.name]: "error" }));
      }
    }

    setCurrentUploadingFile(null);
    setStatusMessage("All USB payloads processed!");
  };

  return (
    <form onSubmit={handleImportUSB} className="w-full">
      {/* Target Book Selection */}
      <label htmlFor="usb-book-select" className={labelCls}>
        📖 Select Target Scrapbook
      </label>
      <select
        id="usb-book-select"
        value={selectedBookId}
        onChange={(e) => setSelectedBookId(e.target.value)}
        className={inputCls}
        required
      >
        <option value="" disabled>-- Select a book --</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} {b.subtitle ? `(${b.subtitle})` : ""}
          </option>
        ))}
      </select>

      {/* USB Detector Section */}
      <div className="mt-6 p-6 bg-white/40 border-[1.5px] border-db-border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
        <span className="text-[2.2rem] mb-2">🔌</span>
        <h4 className="font-hand text-[1.4rem] font-bold text-db-text m-0 mb-1">
          USB Media Mount
        </h4>
        <p className="font-sans text-[0.8rem] text-db-muted max-w-[400px] m-0 mb-4">
          {statusMessage}
        </p>

        <button
          type="button"
          onClick={handleScanUSB}
          disabled={isScanning || isUploading}
          className="font-hand text-[1.2rem] font-bold text-db-accent bg-transparent border-2 border-db-accent rounded px-4 py-1.5 uppercase hover:bg-db-accent hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScanning ? "Scanning..." : "🔍 Scan USB Folder"}
        </button>
      </div>

      {/* Detected Payloads List */}
      {detectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-hand text-[1.3rem] font-bold text-db-text mb-2">
            Payloads Ready for Import ({detectedFiles.length})
          </h4>
          <div className="border-[1.5px] border-db-border rounded-md bg-white/50 max-h-[180px] overflow-y-auto divide-y divide-db-border/30">
            {detectedFiles.map((file) => {
              const status = uploadStatus[file.name] || "pending";
              const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);

              return (
                <div key={file.name} className="flex items-center justify-between px-3.5 py-2 text-[0.85rem] font-mono">
                  <div className="flex flex-col truncate max-w-[70%]">
                    <span className="text-db-text truncate font-semibold">{file.name}</span>
                    <span className="text-[0.7rem] text-db-muted">{sizeInMB} MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "pending" && (
                      <span className="text-db-muted font-bold text-[0.75rem] uppercase">Pending</span>
                    )}
                    {status === "uploading" && (
                      <span className="text-db-accent font-bold text-[0.75rem] uppercase animate-pulse">Uploading...</span>
                    )}
                    {status === "success" && (
                      <span className="text-green-600 font-bold text-[0.75rem] uppercase">✓ Success</span>
                    )}
                    {status === "error" && (
                      <span className="text-red-600 font-bold text-[0.75rem] uppercase">✗ Error</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bind/Upload Button */}
      <button
        type="submit"
        disabled={isUploading || isScanning || detectedFiles.length === 0}
        className="mt-8 w-full font-hand text-[1.55rem] font-bold text-db-accent bg-transparent border-[3px] border-db-accent rounded-md px-8 py-2.5 uppercase cursor-pointer -rotate-[1.5deg] tracking-[0.5px] transition-all duration-200 hover:enabled:bg-db-accent hover:enabled:text-white hover:enabled:rotate-0 hover:enabled:scale-[1.02] hover:enabled:shadow-[0_4px_12px_rgba(190,74,42,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading
          ? `Importing: ${currentUploadingFile ? currentUploadingFile : "Processing..."}`
          : "Import USB Payloads to Scrapbook 🚀"}
      </button>
    </form>
  );
};

// ─── Page Upload Form ───────────────────────────────────────────────────────

interface PageFormProps {
  books: BookRecord[];
  isUploading: boolean;
  uploadProgress: string;
  onPageUpload: (payload: PageUploadPayload) => Promise<void>;
}

const PageUploadForm: React.FC<PageFormProps> = ({
  books, isUploading, uploadProgress, onPageUpload,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookId, setBookId] = useState("");
  const [order, setOrder] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) { setStatus({ type: "error", msg: "🎬 Choose a video file first!" }); return; }
    if (!title.trim()) { setStatus({ type: "error", msg: "✏️ Give this memory a title!" }); return; }
    setStatus(null);
    try {
      await onPageUpload({ videoFile, title: title.trim(), description: description.trim(), bookId, order });
      setStatus({ type: "success", msg: "📌 Memory pinned to your scrapbook!" });
      setVideoFile(null); setTitle(""); setDescription(""); setBookId(""); setOrder("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Something went wrong." });
    }
  };

  const selectCls = `${inputCls} appearance-none pr-9 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237d6958' d='M6 8L1 3h10z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center]`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className={labelCls}>Video File</label>
      <DropZone
        accept="video/*"
        file={videoFile}
        onChange={setVideoFile}
        icon="🎬"
        text="Drop your video here"
        hint="MP4 / MOV / AVI — uploads via YouTube"
        disabled={isUploading}
      />

      <hr className="border-none border-t-[1.5px] border-dashed border-black/12 my-6" />

      <label htmlFor="page-title" className={labelCls}>Memory Title *</label>
      <input id="page-title" type="text" className={inputCls}
        placeholder="e.g. Lantern festival night" value={title}
        onChange={(e) => setTitle(e.target.value)} disabled={isUploading} maxLength={120} />

      <label htmlFor="page-desc" className={labelCls}>
        Description <span className="font-sans font-normal text-[1rem] opacity-60">(optional)</span>
      </label>
      <textarea
        id="page-desc"
        className={`${inputCls} min-h-[90px] bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:100%_28px] leading-7 resize-y`}
        placeholder="Write a little note about this memory…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isUploading}
        maxLength={500}
        rows={3}
      />

      <hr className="border-none border-t-[1.5px] border-dashed border-black/12 my-6" />

      {/* Book assignment + order */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label htmlFor="page-book" className={labelCls}>
            Assign to Book <span className="font-sans font-normal text-[1rem] opacity-60">(optional)</span>
          </label>
          <select id="page-book" className={selectCls}
            value={bookId} onChange={(e) => setBookId(e.target.value)} disabled={isUploading}>
            <option value="">— Unassigned / loose page —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="page-order" className={labelCls}>Page #</label>
          <input id="page-order" type="number" className={`${inputCls} w-20`}
            placeholder="—" min={0} value={order}
            onChange={(e) => setOrder(e.target.value)}
            disabled={isUploading || !bookId} />
        </div>
      </div>

      {isUploading && uploadProgress && <ProgressBar message={uploadProgress} />}
      {status && !isUploading && <StatusFlash {...status} />}

      <button
        type="submit"
        id="pin-memory-btn"
        disabled={isUploading}
        className="mt-8 w-full font-hand text-[1.55rem] font-bold text-db-accent bg-transparent border-[3px] border-db-accent rounded-md px-8 py-2.5 uppercase cursor-pointer -rotate-[1.5deg] tracking-[0.5px] transition-all duration-200 hover:enabled:bg-db-accent hover:enabled:text-white hover:enabled:rotate-0 hover:enabled:scale-[1.02] hover:enabled:shadow-[0_4px_12px_rgba(190,74,42,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading…" : "Pin This Memory 📌"}
      </button>
    </form>
  );
};

// ─── UploadTab (root) ───────────────────────────────────────────────────────

type UploadMode = "book" | "page" | "usb";

export const UploadTab: React.FC<UploadTabProps> = ({
  books, isUploading, uploadProgress, userName, userEmail,
  onCreateBook, onPageUpload,
}) => {
  const [mode, setMode] = useState<UploadMode>("page");

  const tabBtn = (m: UploadMode, label: string) => (
    <button
      role="tab"
      aria-selected={mode === m}
      type="button"
      onClick={() => setMode(m)}
      className={`font-hand text-[1.3rem] font-bold rounded-[4px] px-5 py-1.5 uppercase tracking-[0.5px] border-[2.5px] transition-all duration-200
        ${m === "book" ? "-rotate-[1.5deg]" : "rotate-[1deg]"}
        ${mode === m
          ? "bg-db-accent text-white border-db-accent rotate-0 scale-[1.02] shadow-[2px_3px_0_rgba(0,0,0,0.12)]"
          : "bg-transparent text-db-accent border-db-accent hover:bg-[rgba(190,74,42,0.06)] hover:rotate-0 hover:scale-[1.04]"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto flex justify-center items-start">
      <div className="w-full max-w-[720px]">
        {/* Notebook paper card */}
        <div className="bg-[#fffdf8] border-l-4 border-[#e7a098] bg-notebook-lines rounded-[2px_8px_8px_2px] shadow-[2px_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] px-10 py-9 relative overflow-hidden">
          {/* Header */}
          <h2 className="font-hand text-[2.6rem] font-bold text-db-text m-0 mb-1 leading-none">
            New Memories
          </h2>
          <p className="font-sans text-[0.78rem] font-semibold uppercase tracking-[1.5px] text-db-muted mb-7">
            Welcome back, {userName || userEmail} — add to your scrapbook
          </p>

          {/* Mode tabs */}
          <div className="flex gap-3 mb-8 flex-wrap" role="tablist">
            {tabBtn("book", "📖 New Book")}
            {tabBtn("page", "📄 Add Page")}
            {tabBtn("usb", "📄 Upload From USB")}
          </div>

          {mode === "book" ? (
            <BookCreationForm
              books={books}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onCreateBook={onCreateBook}
            />
          ) : mode === "page" ? (
            <PageUploadForm
              books={books}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onPageUpload={onPageUpload}
            />
          ) : mode === "usb" ? (
            <UsbUploadForm
              books={books}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onPageUpload={onPageUpload}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
