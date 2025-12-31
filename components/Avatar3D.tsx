
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Gender } from '../types';

interface Avatar3DProps {
  isSpeaking: boolean;
  gender?: Gender;
  intensity?: number;
}

const CharacterModel = React.memo(({ isSpeaking, gender = 'male' }: Avatar3DProps) => {
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Materiales de alta calidad optimizados para rendimiento
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#ffdbac", 
    roughness: 0.3, 
    metalness: 0.05 
  }), []);

  const clothMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: gender === 'male' ? "#1e40af" : "#be185d", 
    roughness: 0.8 
  }), [gender]);

  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: gender === 'male' ? "#1a1a1a" : "#452719", 
    roughness: 0.1 
  }), [gender]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Movimiento sutil de respiración y seguimiento de mouse
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, (state.mouse.x * 0.3) + Math.sin(t * 0.5) * 0.05, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, (state.mouse.y * -0.2) + Math.cos(t * 0.4) * 0.02, 0.1);
      
      if (isSpeaking) {
        // Movimiento de cabeza al hablar
        headRef.current.position.y = 1.4 + Math.sin(t * 12) * 0.015;
        headRef.current.rotation.z = Math.sin(t * 8) * 0.02;
      } else {
        headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, 1.4, 0.1);
      }
    }

    // Animación de la boca (Sincronización labial fluida)
    if (mouthRef.current) {
      if (isSpeaking) {
        const mouthOpen = 0.2 + Math.abs(Math.sin(t * 15)) * 1.5;
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, mouthOpen, 0.3);
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1 + Math.sin(t * 10) * 0.2, 0.3);
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.05, 0.2);
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1, 0.2);
      }
    }

    // Parpadeo natural
    const blink = Math.sin(t * 0.8) > 0.98;
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeScale = blink ? 0.05 : 1;
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, eyeScale, 0.4);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, eyeScale, 0.4);
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* Cuerpo */}
      <group ref={bodyRef}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.7, 1.4, 8, 16]} />
          <primitive object={clothMaterial} attach="material" />
        </mesh>
      </group>
      
      {/* Cabeza */}
      <group ref={headRef} position={[0, 1.4, 0]}>
        <mesh>
          <sphereGeometry args={[0.65, 32, 32]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Cabello */}
        <group position={[0, 0.2, 0]}>
          <mesh position={[0, 0.35, -0.1]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.68, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <primitive object={hairMaterial} attach="material" />
          </mesh>
          {gender === 'female' && (
             <mesh position={[0, -0.3, -0.2]}>
               <cylinderGeometry args={[0.7, 0.7, 0.8, 32]} />
               <primitive object={hairMaterial} attach="material" />
             </mesh>
          )}
        </group>

        {/* Ojos */}
        <mesh ref={leftEyeRef} position={[-0.22, 0.1, 0.55]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#111" roughness={0} metalness={0.8} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.22, 0.1, 0.55]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#111" roughness={0} metalness={0.8} />
        </mesh>

        {/* Boca */}
        <mesh ref={mouthRef} position={[0, -0.28, 0.58]} rotation={[0.1, 0, 0]}>
          <capsuleGeometry args={[0.1, 0.02, 4, 8]} />
          <meshBasicMaterial color="#301010" />
        </mesh>
      </group>

      <ContactShadows opacity={0.4} scale={5} blur={2.4} far={10} color="#000" />
    </group>
  );
});

const Avatar3D: React.FC<Avatar3DProps> = ({ isSpeaking, gender = 'male' }) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={40} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <spotLight position={[-5, 5, 5]} angle={0.15} penumbra={1} intensity={1} color="#3b82f6" />
        <Environment preset="city" />
        
        <React.Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
            <CharacterModel isSpeaking={isSpeaking} gender={gender} />
          </Float>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default Avatar3D;
