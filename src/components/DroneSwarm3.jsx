import React, { useRef, useMemo, useState, useLayoutEffect, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { imageToPoints } from '../utils/imageToPoints';

console.log("DroneSwarm module loaded");

const COUNT = 4000; // Total number of drones
const DURATION = 5000; // Duration for each formation

// Helper to generate cube formation
const generateCube = (count) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const side = Math.ceil(Math.pow(count, 1/3));
  const scale = 20;
  
  for (let i = 0; i < count; i++) {
    const x = (i % side) / side;
    const y = (Math.floor(i / side) % side) / side;
    const z = Math.floor(i / (side * side)) / side;
    
    positions[i * 3] = (x - 0.5) * scale;
    positions[i * 3 + 1] = (y - 0.5) * scale + 10; // Start slightly above ground
    positions[i * 3 + 2] = (z - 0.5) * scale;
    
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;
  }
  return { positions, colors };
};

// Helper to generate ground formation (landing)
const generateGround = (count) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));
  const scale = 50;
  
  for (let i = 0; i < count; i++) {
    const x = (i % side) / side;
    const z = Math.floor(i / side) / side;
    
    positions[i * 3] = (x - 0.5) * scale;
    positions[i * 3 + 1] = 0; // On ground
    positions[i * 3 + 2] = (z - 0.5) * scale;
    
    colors[i * 3] = 0.2;
    colors[i * 3 + 1] = 0.2;
    colors[i * 3 + 2] = 0.2;
  }
  return { positions, colors };
};

export function DroneSwarm({ setSequenceState }) {
  console.log("DroneSwarm rendering");
  const mesh = useRef();
  const [formations, setFormations] = useState(null);
  const [currentFormationIndex, setCurrentFormationIndex] = useState(-1); 
  
  // Current and target buffers
  const currentPositions = useRef(new Float32Array(COUNT * 3));
  const currentColors = useRef(new Float32Array(COUNT * 3));
  const targetPositions = useRef(new Float32Array(COUNT * 3));
  const targetColors = useRef(new Float32Array(COUNT * 3));

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Load formations
  useEffect(() => {
    console.log("DroneSwarm useEffect running");
    
    const load = async () => {
      console.log("Starting load...");
      // Wait for 1 second to ensure logs are captured
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log("Waited 1s...");
      
      try {
        const cube = generateCube(COUNT);
        const ground = generateGround(COUNT);
        
        console.log("Loading images...");
        // Load images
        // Note: Adjust scale and threshold as needed for best visual
        console.log("Loading SAR...");
        const sar = await imageToPoints({ url: '/SAR위성.png', scale: 0.15, threshold: 10 });
        console.log("Loaded SAR");
        
        console.log("Loading K9...");
        const k9 = await imageToPoints({ url: '/K9자주포.png', scale: 0.15, threshold: 10 });
        console.log("Loaded K9");
        
        console.log("Loading Cheongung...");
        const cheongung = await imageToPoints({ url: '/천궁2.png', scale: 0.15, threshold: 10 });
        console.log("Loaded Cheongung");
        
        console.log("Loading Logo...");
        const logo = await imageToPoints({ url: '/ADD로고.png', scale: 0.15, threshold: 10 });
        console.log("Loaded Logo");
        
        setFormations({
          ground,
          cube,
          sar,
          k9,
          cheongung,
          logo
        });
        
        // Initialize with ground positions
        currentPositions.current.set(ground.positions);
        currentColors.current.set(ground.colors);
        targetPositions.current.set(ground.positions);
        targetColors.current.set(ground.colors);
        
        // Start sequence after loading
        setCurrentFormationIndex(0); 
      } catch (e) {
        console.error("Failed to load formations:", e);
      }
    };
    
    load();
  }, []);

  // Sequence logic
  useEffect(() => {
    if (!formations || currentFormationIndex === -1) return;
    
    const sequence = ['cube', 'sar', 'k9', 'cheongung', 'logo', 'ground'];
    
    if (currentFormationIndex >= sequence.length) return; // End of sequence

    const formationName = sequence[currentFormationIndex];
    const formation = formations[formationName];
    
    if (formation) {
      console.log(`Transitioning to ${formationName}`);
      
      // Update target buffers
      const len = formation.positions.length / 3;
      for (let i = 0; i < COUNT; i++) {
        const srcIdx = i % len;
        
        let tx = formation.positions[srcIdx * 3];
        let ty = formation.positions[srcIdx * 3 + 1];
        let tz = formation.positions[srcIdx * 3 + 2];
        
        let r = formation.colors[srcIdx * 3];
        let g = formation.colors[srcIdx * 3 + 1];
        let b = formation.colors[srcIdx * 3 + 2];

        // Adjustments
        if (formationName !== 'ground' && formationName !== 'cube') {
          ty += 20; // Lift image formations
        }
        
        targetPositions.current[i * 3] = tx;
        targetPositions.current[i * 3 + 1] = ty;
        targetPositions.current[i * 3 + 2] = tz;
        
        targetColors.current[i * 3] = r;
        targetColors.current[i * 3 + 1] = g;
        targetColors.current[i * 3 + 2] = b;
      }
      
      if (setSequenceState) setSequenceState(formationName);
      
      // Schedule next formation
      const timeout = setTimeout(() => {
        setCurrentFormationIndex(prev => prev + 1);
      }, DURATION);
      
      return () => clearTimeout(timeout);
    }
  }, [currentFormationIndex, formations]);

  useFrame((state, delta) => {
    if (!mesh.current || !formations) return;

    const time = state.clock.elapsedTime;
    const lerpFactor = delta * 2; // Adjust speed

    for (let i = 0; i < COUNT; i++) {
      // Lerp position
      const cx = currentPositions.current[i * 3];
      const cy = currentPositions.current[i * 3 + 1];
      const cz = currentPositions.current[i * 3 + 2];
      
      const tx = targetPositions.current[i * 3];
      const ty = targetPositions.current[i * 3 + 1];
      const tz = targetPositions.current[i * 3 + 2];
      
      currentPositions.current[i * 3] = THREE.MathUtils.lerp(cx, tx, lerpFactor);
      currentPositions.current[i * 3 + 1] = THREE.MathUtils.lerp(cy, ty, lerpFactor);
      currentPositions.current[i * 3 + 2] = THREE.MathUtils.lerp(cz, tz, lerpFactor);
      
      // Lerp color
      currentColors.current[i * 3] = THREE.MathUtils.lerp(currentColors.current[i * 3], targetColors.current[i * 3], lerpFactor);
      currentColors.current[i * 3 + 1] = THREE.MathUtils.lerp(currentColors.current[i * 3 + 1], targetColors.current[i * 3 + 1], lerpFactor);
      currentColors.current[i * 3 + 2] = THREE.MathUtils.lerp(currentColors.current[i * 3 + 2], targetColors.current[i * 3 + 2], lerpFactor);

      // Noise/Hover
      const noiseX = Math.sin(time + i * 0.1) * 0.1;
      const noiseY = Math.cos(time * 0.8 + i * 0.2) * 0.1;
      const noiseZ = Math.sin(time * 1.2 + i * 0.3) * 0.1;

      dummy.position.set(
        currentPositions.current[i * 3] + noiseX,
        currentPositions.current[i * 3 + 1] + noiseY,
        currentPositions.current[i * 3 + 2] + noiseZ
      );
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      
      mesh.current.setColorAt(i, new THREE.Color(
        currentColors.current[i * 3],
        currentColors.current[i * 3 + 1],
        currentColors.current[i * 3 + 2]
      ));
    }
    
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, COUNT]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
