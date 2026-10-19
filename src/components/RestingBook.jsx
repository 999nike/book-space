import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Book } from "./Book";
import { settleBookOnDesk } from "./desk-contact";

function BookContact({ book, covers }) {
  const cache = useMemo(() => ({}), []);
  useFrame(() => {
    if (book.current) settleBookOnDesk(book.current, covers.current, cache);
  });
  return null;
}
export function RestingBook() {
  const book = useRef(), covers = useRef({ front: null, back: null });
  const onCoverMesh = useCallback((number, mesh) => {
    covers.current[number === 0 ? "front" : "back"] = mesh;
  }, []);
  return (
    <group ref={book} rotation-x={-Math.PI / 2} position-y={0.05}>
      <Book steady onCoverMesh={onCoverMesh} />
      <BookContact book={book} covers={covers} />
    </group>
  );
}
