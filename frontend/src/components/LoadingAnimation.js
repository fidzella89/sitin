import React from "react";
import Lottie from "lottie-react";
import typingAnimation from "../assets/persontyping.json"; 

const TypingAnimation = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-50">
      <Lottie 
        animationData={typingAnimation} 
        loop={true} 
        style={{ width: "500px", height: "500px" }} // Adjust size here
      />
    </div>
  );
};

export default TypingAnimation;
