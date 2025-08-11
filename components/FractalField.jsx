import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * A single fractal blob. This component renders a rotating icosahedron that
 * subtly pulses when hovered. The colour darkens on hover to provide
 * feedback. Scale and position props allow layout control.
 */
function FractalBlob({ scale = 1, position = [0, 0, 0] }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.2 * delta;
      meshRef.current.rotation.y += 0.15 * delta;
    }
  });
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial
        color={hovered ? '#6B7280' : '#111827'}
        roughness={0.4}
        metalness={0.2}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  );
}

/**
 * A 3D field composed of several fractal blobs. Uses a Three.js canvas
 * configured to re-render on demand for efficiency. Lighting and controls
 * create depth and allow gentle interaction.
 */
export default function FractalField() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} className="h-[60vh] w-full" frameloop="demand">
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <FractalBlob scale={1.4} position={[0.2, 0.1, 0]} />
      <FractalBlob scale={0.9} position={[-2.2, -0.6, -1]} />
      <FractalBlob scale={0.8} position={[2.2, 0.6, -1]} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={(2 * Math.PI) / 3} />
    </Canvas>
  );
}