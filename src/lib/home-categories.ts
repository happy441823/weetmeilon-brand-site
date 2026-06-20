import type { CatalogCategory } from "@/types/catalog";

export function pickHomeBrowseCategories(categories: CatalogCategory[]) {
  return categories
    .filter((category) => category.visible && category.level === "primary")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
