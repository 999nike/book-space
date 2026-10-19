import { Box3, Group, Vector3 } from "three";
export const DESK_MODEL_URL = "/scene-assets/wooden-desk-web.glb";
export const DESK_WIDTH = 5.2;
export const DESK_SURFACE_Y = 0;
export const DESK_FLOOR_Y = -2.751;
export function prepareDesk(source) {
  const desk = new Group(), model = source.clone(true);
  const ownedMaterials = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true; object.receiveShadow = true;
    const solid = original => {
      const material = original.clone();
      material.transparent = false; material.opacity = 1;
      material.alphaTest = 0; material.depthWrite = true; material.depthTest = true;
      if ("transmission" in material) material.transmission = 0;
      material.needsUpdate = true;
      ownedMaterials.add(material);
      return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(solid) : solid(object.material);
  });
  desk.add(model);
  desk.rotation.y = -Math.PI / 2;
  desk.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(desk), size = bounds.getSize(new Vector3());
  desk.scale.setScalar(DESK_WIDTH / size.x);
  desk.updateMatrixWorld(true); bounds.setFromObject(desk);
  const center = bounds.getCenter(new Vector3());
  desk.position.set(-center.x, DESK_SURFACE_Y - bounds.max.y, -center.z);
  desk.updateMatrixWorld(true);
  return { desk, ownedMaterials };
}
