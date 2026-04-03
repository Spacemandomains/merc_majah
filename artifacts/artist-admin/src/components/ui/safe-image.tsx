import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: ReactNode;
}

export function SafeImage({ src, alt, fallback = null, onError, ...props }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      onError={(e) => {
        setErrored(true);
        onError?.(e);
      }}
      {...props}
    />
  );
}
