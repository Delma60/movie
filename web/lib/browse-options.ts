export type BrowseSort = "newest" | "oldest" | "title-asc" | "title-desc";

export const BROWSE_SORTS: { value: BrowseSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];
