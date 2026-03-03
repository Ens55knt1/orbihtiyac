import React from "react";

/** Logo: public/orbisis.logo.png dosyasını kullanır */
const LOGO_SRC = "/orbisis.logo.png";

export const OrbisisLogo: React.FC<{
  className?: string;
  height?: number;
  showTagline?: boolean;
}> = ({ className = "", height = 32 }) => {
  return (
    <img
      src={LOGO_SRC}
      alt="ORBISIS"
      className={className}
      height={height}
      width="auto"
      style={{ display: "block" }}
    />
  );
};
