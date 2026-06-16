export type AdminProductSubmission = {
  id: string;
  name: string;
  seriesLabel: string;
  cardTitle: string;
  cardDescription: string;
  categoryId: string;
  subcategoryId: string | null;
  tmallUrl: string | null;
  jdUrl: string | null;
  coverImage: string;
  originalFileName: string;
  notes: string;
  reviewStatus: "pending_review" | "approved" | "needs_revision";
  createdAt: string;
  updatedAt: string;
};
