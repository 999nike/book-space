import { Component, Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { DESK_MODEL_URL, prepareDesk } from "./desk-layout";

function DeskPlaceholder() {
  return (
    <mesh position-y={-0.075} receiveShadow>
      <boxGeometry args={[5.2, 0.15, 2.474]} />
      <meshStandardMaterial color="#655041" roughness={0.75} />
    </mesh>
  );
}
class DeskBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <DeskPlaceholder /> : this.props.children; }
}
function LoadedDesk() {
  const { scene } = useGLTF(DESK_MODEL_URL);
  const { desk, ownedMaterials } = useMemo(() => prepareDesk(scene), [scene]);
  useEffect(() => () => ownedMaterials.forEach(material => material.dispose()), [ownedMaterials]);
  return <primitive object={desk} />;
}
export function WoodenDesk() {
  return (
    <DeskBoundary>
      <Suspense fallback={<DeskPlaceholder />}><LoadedDesk /></Suspense>
    </DeskBoundary>
  );
}
