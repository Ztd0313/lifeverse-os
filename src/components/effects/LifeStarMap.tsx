'use client';

/// <reference types="@react-three/fiber" />

/**
 * LifeStarMap — 3D 生命星图
 *
 * 基于 React Three Fiber 的 3D 星空场景：用户的生命记忆/成就是星空中
 * 可旋转查看的星点，每颗星带脉冲呼吸动画，相近星点之间以金色细线相连。
 *
 * 使用方式：
 * ```tsx
 * <LifeStarMap height={500} autoRotate accentColor="gold" onStarClick={(s) => console.log(s)} />
 * ```
 */

import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/** 单颗生命星星的数据结构（代表一个记忆/成就） */
export interface StarData {
  id: string;
  label: string;
  /** 3D 位置 [-10, 10] 范围 */
  position: [number, number, number];
  /** 星星大小，默认 0.15 */
  size?: number;
  /** 星星颜色 */
  color?: string;
  /** 亮度 0-1 */
  intensity?: number;
}

export interface LifeStarMapProps {
  /** 星星数据（每个代表一个记忆/成就） */
  stars?: StarData[];
  /** 画布高度 */
  height?: number;
  /** 是否自动旋转 */
  autoRotate?: boolean;
  /** 星星点击回调 */
  onStarClick?: (star: StarData) => void;
  /** 主题色 */
  accentColor?: 'gold' | 'blue' | 'purple';
}

/** 主题色映射 */
const ACCENT_COLORS: Record<NonNullable<LifeStarMapProps['accentColor']>, string> = {
  gold: '#c9a84c',
  blue: '#5da0e8',
  purple: '#9d4edd',
};

/** 星星数量上限，保护性能 */
const MAX_STARS = 50;

/** 连线最大距离阈值（小于此距离的星点之间连线） */
const CONNECTION_THRESHOLD = 5;

/**
 * 基于 id 生成稳定的哈希相位，让不同星星的脉冲不同步，
 * 避免所有星星整齐划一地呼吸。
 */
function hashPhase(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 1000) / 1000) * Math.PI * 2;
}

/**
 * 生成默认星星数据：在球壳区域（半径 4-9）随机分布，
 * 标签轮换为「记忆 / 成就 / 时刻 / 感悟」。
 */
function generateDefaultStars(count = 12): StarData[] {
  const labelKinds = ['记忆', '成就', '时刻', '感悟'];
  return Array.from({ length: count }, (_, i) => {
    const r = 4 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      id: `default-star-${i}`,
      label: `${labelKinds[i % labelKinds.length]} ${Math.floor(i / labelKinds.length) + 1}`,
      position: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ] as [number, number, number],
      size: 0.12 + Math.random() * 0.1,
      intensity: 0.6 + Math.random() * 0.4,
    };
  });
}

interface StarMeshProps {
  star: StarData;
  accentColor: string;
  onStarClick?: (star: StarData) => void;
}

/**
 * StarMesh — 单颗生命星星
 *
 * - mesh + sphereGeometry + meshBasicMaterial 渲染星点
 * - pointLight 附着发光
 * - useFrame 实现脉冲呼吸动画（scale 在 0.8-1.2 之间循环）
 * - hover 放大 + 显示 label（drei Html）
 * - click 触发 onStarClick
 */
function StarMesh({ star, accentColor, onStarClick }: StarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const phase = useMemo(() => hashPhase(star.id), [star.id]);
  const color = star.color ?? accentColor;
  const baseSize = star.size ?? 0.15;
  const intensity = star.intensity ?? 1;

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    // 脉冲呼吸：0.8 - 1.2 之间循环
    const pulse = 1 + Math.sin(t * 1.5 + phase) * 0.2;
    const hoverScale = hovered ? 1.6 : 1;
    mesh.scale.setScalar(baseSize * pulse * hoverScale);
    // 在 demand 模式下持续触发重绘，维持脉冲动画
    state.invalidate();
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onStarClick?.(star);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  };

  return (
    <group position={star.position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={intensity * 2} distance={6} decay={2} />
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.6, 0]} center>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(10, 12, 24, 0.85)',
              color: '#ffffff',
              fontSize: 12,
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
              boxShadow: `0 0 12px ${color}55`,
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          >
            {star.label}
          </div>
        </Html>
      )}
    </group>
  );
}

interface StarConnectionsProps {
  stars: StarData[];
  threshold?: number;
}

/**
 * StarConnections — 星际连线
 *
 * 计算所有距离小于 threshold 的星点对，用 LineSegments 绘制金色细线，
 * 透明度 0.15。使用 primitive 渲染预构建的 THREE.LineSegments 对象，
 * 卸载时清理 geometry / material 资源。
 */
function StarConnections({ stars, threshold = CONNECTION_THRESHOLD }: StarConnectionsProps) {
  const lineSegments = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i].position;
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j].position;
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < threshold) {
          positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: '#c9a84c',
      transparent: true,
      opacity: 0.15,
    });
    return new THREE.LineSegments(geometry, material);
  }, [stars, threshold]);

  // 组件卸载 / stars 变化时清理资源
  useEffect(() => {
    return () => {
      lineSegments.geometry.dispose();
      (lineSegments.material as THREE.Material).dispose();
    };
  }, [lineSegments]);

  return <primitive object={lineSegments} />;
}

interface StarMapSceneProps {
  stars: StarData[];
  autoRotate: boolean;
  accentColor: string;
  onStarClick?: (star: StarData) => void;
}

/**
 * StarMapScene — 场景内容
 *
 * 包含：环境光 + 背景星空 + 生命星星 + 星际连线 + OrbitControls。
 */
function StarMapScene({ stars, autoRotate, accentColor, onStarClick }: StarMapSceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      {/* 背景星空 */}
      <Stars
        radius={50}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      {/* 生命星星 */}
      {stars.map((star) => (
        <StarMesh
          key={star.id}
          star={star}
          accentColor={accentColor}
          onStarClick={onStarClick}
        />
      ))}
      {/* 星际连线 */}
      <StarConnections stars={stars} />
      {/* 轨道控制：旋转 / 缩放 */}
      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

/**
 * LifeStarMap — 3D 生命星图组件
 *
 * 一个 3D 星空场景，用户的生命记忆/成就是星空中的星星，可以旋转查看。
 *
 * 特性：
 * - 透明背景，dpr 限制 [1, 2] 保性能
 * - drei Stars 生成 2000 颗背景星
 * - 每颗生命星带脉冲呼吸动画 + pointLight 发光
 * - hover 放大并显示标签，click 触发回调
 * - 相近星点之间金色细线相连
 * - OrbitControls 旋转/缩放，可自动旋转
 * - 未传入 stars 时生成 12 颗默认星星，最多渲染 50 颗
 */
export function LifeStarMap({
  stars,
  height = 400,
  autoRotate = false,
  onStarClick,
  accentColor = 'gold',
}: LifeStarMapProps) {
  const resolvedStars = useMemo(() => {
    const data = stars ?? generateDefaultStars();
    // 数量上限保护性能
    return data.slice(0, MAX_STARS);
  }, [stars]);

  const accent = ACCENT_COLORS[accentColor];

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]}
        frameloop={autoRotate ? 'always' : 'demand'}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <StarMapScene
          stars={resolvedStars}
          autoRotate={autoRotate}
          accentColor={accent}
          onStarClick={onStarClick}
        />
      </Canvas>
    </div>
  );
}

/**
 * DefaultLifeStarMap — 便捷组件
 *
 * 预设 12 颗默认生命星星，开箱即用。
 */
export function DefaultLifeStarMap(props: Omit<LifeStarMapProps, 'stars'>) {
  const defaultStars = useMemo(() => generateDefaultStars(12), []);
  return <LifeStarMap stars={defaultStars} {...props} />;
}

export default LifeStarMap;
