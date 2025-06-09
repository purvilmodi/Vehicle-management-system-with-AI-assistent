import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Car({ progress = 0 }) {
  const group = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t / 2) / 8;
    group.current.position.y = Math.sin(t / 1.5) / 10;
    // Move car based on form progress
    group.current.position.x = THREE.MathUtils.lerp(-2, 2, progress);
  });

  return (
    <group ref={group}>
      {/* Main body - lower part */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.4, 0.4, 1.2]} />
        <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Upper body - sleek design */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2, 0.3, 1.1]} />
        <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Hood - sloping front */}
      <mesh position={[0.8, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 1]} />
        <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0.2, 0.8, 0]} rotation={[0, 0, -Math.PI * 0.15]} castShadow>
        <boxGeometry args={[0.7, 0.4, 1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} opacity={0.7} transparent />
      </mesh>

      {/* Roof */}
      <mesh position={[-0.3, 0.9, 0]} castShadow>
        <boxGeometry args={[0.9, 0.3, 1]} />
        <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear window */}
      <mesh position={[-0.8, 0.75, 0]} rotation={[0, 0, Math.PI * 0.2]} castShadow>
        <boxGeometry args={[0.5, 0.3, 1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} opacity={0.7} transparent />
      </mesh>

      {/* Front bumper */}
      <mesh position={[1.1, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[-1.1, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[0.7, 0, 0.6]} />
      <Wheel position={[0.7, 0, -0.6]} />
      <Wheel position={[-0.7, 0, 0.6]} />
      <Wheel position={[-0.7, 0, -0.6]} />

      {/* Headlights */}
      <mesh position={[1.2, 0.3, 0.4]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.2, 0.3, -0.4]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Wheel({ position }) {
  return (
    <group position={position}>
      {/* Tire */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
      </mesh>
      {/* Rim */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.151, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#silver" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
} 