import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/constants";

export function canonicalPath(path = "/") {
  return absoluteUrl(path);
}

export function withCanonical(metadata: Metadata, path = "/"): Metadata {
  return {
    ...metadata,
    alternates: {
      canonical: canonicalPath(path)
    }
  };
}
