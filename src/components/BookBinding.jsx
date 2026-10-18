import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide } from "three";
import { createBindingFrame, createBindingGeometry, sampleBindingFrame, updateBindingGeometry } from "./binding-geometry";

export function BookBinding({ covers }) {
  const mesh = useRef();
  const geometry = useMemo(() => createBindingGeometry(), []);
  const frame = useMemo(() => createBindingFrame(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const { front, back } = covers.current;
    if (!mesh.current || !front || !back) return;
    sampleBindingFrame(front, back, mesh.current.parent, frame);
    updateBindingGeometry(geometry, frame);
    mesh.current.visible = true;
  });
  return (
    <mesh ref={mesh} geometry={geometry} visible={false} frustumCulled={false} raycast={() => null} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" color="#100d25" roughness={0.62} metalness={0.18} side={DoubleSide} />
      <meshStandardMaterial attach="material-1" color="#47266e" roughness={0.4} metalness={0.35} side={DoubleSide} />
    </mesh>
  );
}
