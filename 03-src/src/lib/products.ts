import {
  catalogProducts,
  getPublicCatalogProductBySlug,
  getPublicCatalogProducts
} from "@/lib/catalog";
import type { CatalogProduct, PublicCatalogProduct } from "@/types/catalog";

export type Product = PublicCatalogProduct;

export const products = getPublicCatalogProducts();

export const allCatalogProducts = catalogProducts;

export function getProduct(slug: string) {
  return getPublicCatalogProductBySlug(slug);
}
