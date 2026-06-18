"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/**
 * A custom GLSL shader material driving vertex displacement.
 * Demonstrates: raw shaders, uniforms, time-based animation, R3F + Drei.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vDisplacement;

  // Classic 3D simplex-ish noise via sines (cheap, smooth)
  float noise(vec3 p) {
    return sin(p.x * 2.0 + uTime) * cos(p.y * 2.0 + uTime) * sin(p.z * 2.0);
  }

  void main() {
    vUv = uv;
    float displacement = noise(position + uTime * 0.2) * 0.25;
    vDisplacement = displacement;
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDisplacement;

  void main() {
    vec3 colorA = vec3(0.36, 0.32, 0.96); // indigo
    vec3 colorB = vec3(0.93, 0.28, 0.60); // pink
    vec3 color = mix(colorA, colorB, vUv.y + vDisplacement);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function Blob() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh>
        <icosahedronGeometry args={[1.4, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
}

export function ShaderBlob() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.5} />
      <Blob />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
