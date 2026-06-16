"use client";

import Image from "next/image";
import { useState } from "react";

type ImageFrameProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
};

export function ImageFrame({ src, alt, sizes, className = "", imageClassName = "" }: ImageFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[linear-gradient(145deg,#160021_0%,#24103a_54%,#100019_100%)] ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_68%_24%,rgba(144,255,231,0.16),transparent_32%),radial-gradient(circle_at_16%_82%,rgba(188,164,255,0.12),transparent_34%)]" />
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={`relative z-10 object-contain transition duration-500 ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
