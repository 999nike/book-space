import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  return (
    <>
      <UI />
      <div className="book-startup-loader">
      <Loader
        containerStyles={{ background: "#090b18" }}
        innerStyles={{ width: "min(70vw, 360px)", marginTop: 220, background: "#ffffff26" }}
        barStyles={{ background: "#c5b5ff" }}
        dataStyles={{ color: "#fff", fontFamily: "Poppins, sans-serif" }}
        dataInterpolation={progress => `${Math.round(progress)}%`}
      />
      </div>
      <Canvas shadows camera={{ position: [-0.5, 1, 4], fov: 45 }}>
        <group position-y={0}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </>
  );
}

export default App;
