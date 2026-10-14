import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCursor, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { useAtom } from "jotai";
import { easing } from "maath";
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";

import { pageAtom, pages, playbackPageAtom } from "./UI";
import { useHostedVideoTexture } from "./HostedVideo";
import { useIndexPageTexture } from "./IndexPage";
import { getPageContent, getSpreadProject, getSpreadVideo, isBookOpen } from "./page-content";
import { applyVideoPageUVs } from "./video-layout";
import { usePreviewPageTexture } from "./PreviewPage";

const easingFactor = 0.5; 
const easingFactorFold = 0.3; 
const insideCurveStrength = 0.18; 
const outsideCurveStrength = 0.05; 
const turningCurveStrength = 0.09; 

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  // ALL VERTICES
  vertex.fromBufferAttribute(position, i); // get the vertex
  const x = vertex.x; // get the x position of the vertex

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // calculate the skin index
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // calculate the skin weight

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // set the skin indexes
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // set the skin weights
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
];

pages.forEach((page) => {
  useTexture.preload(`/textures/${page.front}.jpg`);
  useTexture.preload(`/textures/${page.back}.jpg`);
  useTexture.preload(`/textures/book-cover-roughness.jpg`);
});

const Page = ({ number, front, back, page, opened, bookClosed, playingPage, requestedPage, turnVersion, onSettled, indexTexture, ...props }) => {
  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length - 1
      ? [`/textures/book-cover-roughness.jpg`]
      : []),
  ]);
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  const previewTexture = usePreviewPageTexture(getSpreadProject(number));
  const spread = number + 1;
  const videoTexture = useHostedVideoTexture(playingPage === spread && isBookOpen(playingPage, pages.length), getSpreadVideo(spread), requestedPage === spread && isBookOpen(requestedPage, pages.length));
  const settledState = useRef({ version: -1, reported: false });
  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);

  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        ...(number === 0
          ? {
              roughnessMap: pictureRoughness,
            }
          : {
              roughness: 0.1,
            }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        ...(number === pages.length - 1
          ? {
              roughnessMap: pictureRoughness,
            }
          : {
              roughness: 0.1,
            }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];
    const geometry = pageGeometry.clone();
    applyVideoPageUVs(geometry, pageGeometry.attributes.uv, getPageContent(number, pages.length));
    const mesh = new SkinnedMesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  // Each face has its own content; the original cover and material effects stay intact.
  useEffect(() => {
    const content = getPageContent(number, pages.length);
    applyVideoPageUVs(manualSkinnedMesh.geometry, pageGeometry.attributes.uv);
    const frontMap = content.front === "video"
      ? videoTexture || picture
      : content.front === "preview" ? previewTexture || indexTexture || picture
      : content.front === "index" ? indexTexture || picture : picture;
    const backMap = content.back === "video" ? videoTexture || picture2 : picture2;
    for (const [index, map] of [[4, frontMap], [5, backMap]]) {
      const material = manualSkinnedMesh.material[index];
      if (material.map !== map) { material.map = map; material.needsUpdate = true; }
    }
  }, [manualSkinnedMesh, number, page, picture, picture2, videoTexture, indexTexture, previewTexture]);

  // useHelper(skinnedMeshRef, SkeletonHelper, "red");

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }

    if (settledState.current.version !== turnVersion) {
      settledState.current = { version: turnVersion, reported: false };
    }
    let settled = true;
    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
      const angleError = target.rotation.y - rotationAngle;
      if (Math.abs(Math.atan2(Math.sin(angleError), Math.cos(angleError))) > 0.006 || Math.abs(target.rotation.x - foldRotationAngle * foldIntensity) > 0.006) settled = false;
    }
    if (settled && Date.now() - turnedAt.current >= 400 && !settledState.current.reported) {
      settledState.current.reported = true;
      onSettled(number, page, turnVersion);
    }
  });

  const [_, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPage(opened ? number : number + 1);
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />

    </group>
  );
};

export const Book = ({ ...props }) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const [playingPage, setPlayingPage] = useAtom(playbackPageAtom);
  const indexTexture = useIndexPageTexture();
  const settledSheets = useRef(new Map());
  const turnTarget = useRef({ requested: null, rendered: null, version: 0 });
  if (turnTarget.current.requested !== page || turnTarget.current.rendered !== delayedPage) {
    turnTarget.current = { requested: page, rendered: delayedPage, version: turnTarget.current.version + 1 };
    settledSheets.current.clear();
  }
  const onSettled = useCallback((number, settledPage, version) => {
    if (version !== turnTarget.current.version) return;
    settledSheets.current.set(number, settledPage);
    if (settledPage !== turnTarget.current.requested || settledPage !== turnTarget.current.rendered) return;
    for (let index = 0; index < pages.length; index++) {
      if (settledSheets.current.get(index) !== settledPage) return;
    }
    setPlayingPage(settledPage);
  }, [setPlayingPage]);

  useEffect(() => {
    let timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      {[...pages].map((pageData, index) => (
        <Page
          key={index}
          indexTexture={indexTexture}
          playingPage={playingPage}
          requestedPage={page}
          turnVersion={turnTarget.current.version}
          onSettled={onSettled}
          page={delayedPage}
          number={index}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
          {...pageData}
        />
      ))}
    </group>
  );
};