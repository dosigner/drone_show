import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fitPointCloud, imageToPoints } from "../utils/imageToPoints";

const BASE_COUNT = 900;

export function BaseStructure() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const [cloud, setCloud] = useState(null);

  useEffect(() => {
    let mounted = true;

    imageToPoints({
      url: "/창조관 형상.png",
      scale: 0.16,
      threshold: 18,
      maxDimension: 200,
    })
      .then((pointCloud) => {
        if (!mounted) {
          return;
        }

        setCloud(
          fitPointCloud(pointCloud, BASE_COUNT, {
            offset: [0, -18, -6],
            depth: 0.8,
            tint: [0.6, 0.95, 1.25],
            glow: 1.1,
            spread: 0.06,
          })
        );
      })
      .catch(() => {
        if (mounted) {
          setCloud(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!meshRef.current || !cloud) {
      return;
    }

    for (let i = 0; i < BASE_COUNT; i += 1) {
      const index = i * 3;
      dummy.position.set(cloud.positions[index], cloud.positions[index + 1], cloud.positions[index + 2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.setRGB(cloud.colors[index], cloud.colors[index + 1], cloud.colors[index + 2]);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [cloud, color, dummy]);

  if (!cloud) {
    return null;
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BASE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.13, 8, 8]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}
