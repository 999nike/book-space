import { Environment, Float, OrbitControls } from "@react-three/drei";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { Vector3 } from "three";
import { easing } from "maath";
import { pageAtom, playbackPageAtom } from "./UI";
import { BOOK_SHEETS, isBookOpen } from "./page-content";
import { getBookFitDistance } from "./book-framing";

import { Book } from "./Book";

const BookCamera = ({ steady = false }) => {
  const page = useAtomValue(pageAtom);
  const playbackPage = useAtomValue(playbackPageAtom);
  const opened = isBookOpen(page, BOOK_SHEETS) || isBookOpen(playbackPage, BOOK_SHEETS);
  const { camera, size } = useThree();
  const controls = useRef();
  const motion = useRef({ initial: true, active: false, distance: 0, goal: 0 });
  const offset = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !camera.isPerspectiveCamera) return;
    offset.copy(camera.position).sub(orbit.target);
    if (offset.lengthSq() < 0.0001) offset.set(-0.5, 1, 4);
    const currentDistance = offset.length();
    const goal = getBookFitDistance({ width: size.width, height: size.height, fov: camera.getEffectiveFOV(), direction: offset.toArray(), opened: steady || opened });
    motion.current.distance = currentDistance;
    motion.current.goal = goal;
    if (motion.current.initial || steady) {
      camera.position.copy(orbit.target).addScaledVector(offset.normalize(), goal);
      orbit.update();
      motion.current.initial = false;
      motion.current.active = false;
      motion.current.distance = goal;
    } else motion.current.active = true;
  }, [camera, size.width, size.height, opened, offset, steady]);

  useFrame((_, delta) => {
    const orbit = controls.current, transition = motion.current;
    if (!orbit || !transition.active) return;
    offset.copy(camera.position).sub(orbit.target).normalize();
    easing.damp(transition, "distance", transition.goal, 0.45, delta);
    easing.damp3(orbit.target, [0, 0, 0], 0.45, delta);
    camera.position.copy(orbit.target).addScaledVector(offset, transition.distance);
    orbit.update();
    if (Math.abs(transition.distance - transition.goal) < 0.001 && orbit.target.lengthSq() < 0.000001) transition.active = false;
  });

  return <OrbitControls ref={controls} makeDefault onStart={() => { motion.current.active = false; }} />;
};

export const Experience = () => {
  // Trial defaults to a steady inspection view; motion=on restores the normal presentation.
  const steady = new URLSearchParams(window.location.search).get("motion") !== "on";
  return (
    <>
      <Float
        rotation-x={-Math.PI / 4}
        floatIntensity={steady ? 0 : 0.5}
        floatingRange={[-0.1, 0.1]}
        speed={steady ? 0 : 1}
        rotationIntensity={steady ? 0 : 1}
      >
        <Book steady={steady} />
      </Float>
      <BookCamera steady={steady} />
      <Environment preset="studio"></Environment>
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};