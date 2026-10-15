import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  return (
    <>
      <UI />
      <Loader
        containerStyles={{ background: "#090b18 url(/images/wizzlab-logo.png) center 42% / min(80vw, 640px) auto no-repeat" }}
        innerStyles={{ width: "min(70vw, 360px)", marginTop: 220, background: "#ffffff26" }}
        barStyles={{ background: "#c5b5ff" }}
        dataStyles={{ color: "#fff", fontFamily: "Poppins, sans-serif" }}
        dataInterpolation={progress => `${Math.round(progress)}%`}
      />
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
