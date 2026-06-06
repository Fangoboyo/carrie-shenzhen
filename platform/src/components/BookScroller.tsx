import "../styles/BookComponent.css";
import type { BookPageData } from "../types/BookComponentTypes";
import { BookComponent } from "./BookComponent";

// Sample mock book data
const MOCK_BOOKS = [
  {
    id: "1",
    title: "High School",
    subtitle: "Vol 1",
    coverColor: "#2b4c7e",
    accentColor: "#ffd700",
  },
  {
    id: "2",
    title: "Summer Trip",
    subtitle: "Memories",
    coverColor: "#c85a17",
    accentColor: "#4f9d9d",
  },
  {
    id: "3",
    title: "Graduation",
    subtitle: "The Day",
    coverColor: "#3a6b5c",
    accentColor: "#e0a96d",
  },
  {
    id: "4",
    title: "Family Album",
    subtitle: "Roots",
    coverColor: "#5c3a21",
    accentColor: "#ecc19c",
  },
  {
    id: "5",
    title: "Adeventures",
    subtitle: "Wilderness",
    coverColor: "#1a331e",
    accentColor: "#8fbc8f",
  },
];

const samplePages: BookPageData[] = [
  {
    title: "Page 1",
    content: "This is the content for page 1.",
  },
  {
    title: "Page 2",
    content: "This is the content for page 2.",
  },
  {
    title: "Page 3",
    content: "This is the content for page 3.",
  },
  {
    title: "Page 4",
    content: "This is the content for page 4.",
  },
];

export const BookComponentMarquee = () => {
  const handleBookClick = (id: string) => {
    alert(`Navigating to book ${id} page!`);
  };

  const doubledBooks = [...MOCK_BOOKS, ...MOCK_BOOKS];

  return (
    <div className="scroller-showcase-box">
      <div className="marquee-wrapper">
        <div className="marquee-track">
          {doubledBooks.map((book, idx) => (
            <div key={`${book.id}-${idx}`} className="marquee-item">
              <BookComponent
                title={book.title}
                subtitle={book.subtitle}
                pages={samplePages}
                coverColor={book.coverColor}
                accentColor={book.accentColor}
                onClick={() => handleBookClick(book.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
