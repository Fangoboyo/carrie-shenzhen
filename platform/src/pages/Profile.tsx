import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookComponentMarquee } from "../components/BookScroller";
import { pb } from "../lib/pocketbase";
import type { PageRecord } from "../types/BookComponentTypes";

export default function Profile() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
          privacyStatus: "unlisted", // unlisted by default
        },
      };

      setUploadProgress("Initiating YouTube upload session...");

      // Step 1: Initiate Resumable Session
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

      // Step 2: Upload Video File
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

      // Saved to the 'pages' collection (formerly 'videos')
      // book and order are optional — pages without a book are unassigned drafts
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

  return (
    <div className="scrapbook-container">
      <header>
        <Link to="/" className="logo">
          Scrapbook
        </Link>
        <nav>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            Log Out
          </a>
        </nav>
      </header>

      <div className="test-split-container">
        <BookComponentMarquee />
      </div>

      <div className="notebook-paper">
        <h2 style={{ marginTop: 0 }}>My Collection</h2>
        <p>Welcome, {pb.authStore.model?.name || pb.authStore.model?.email}!</p>

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "2px dashed var(--accent)",
            textAlign: "center",
          }}
        >
          <label
            className="btn-stamp"
            style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
          >
            {isUploading ? uploadProgress : "Upload Video to YouTube"}
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

      <div className="video-grid">
        {pages.map((page, idx) => (
          <div
            className="polaroid"
            key={page.id}
            style={{ transform: `rotate(${idx % 2 === 0 ? 3 : -2}deg)` }}
          >
            <div className="tape"></div>
            <div
              style={{
                width: "100%",
                height: "200px",
                backgroundColor: "#000",
              }}
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${page.youtubeId}`}
                title={page.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="caption">{page.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
