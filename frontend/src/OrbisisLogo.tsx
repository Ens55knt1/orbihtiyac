import React from "react";

/** Logo: public/ORBihtiyac.png */
const LOGO_SRC = "/ORBihtiyac.png";

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
