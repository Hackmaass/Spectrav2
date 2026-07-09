import React from "react";
import Spline from "@splinetool/react-spline";
import scene from "../../assets/design.splinecode";

export const HeroDesign = () => {
  return (
    <div id="hero-spline">
      <Spline scene={scene} />
    </div >
  );
};
