import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Html,
  OrbitControls,
  Sky,
  Stars,
} from "@react-three/drei";
import {
  CapsuleCollider,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { Vector3 } from "three";
import { Hud } from "../../components/ui/Hud";
import {
  selectCollectedItems,
  selectUnlockedAreas,
  usePlayerStore,
} from "../../store/playerStore";

type MovementState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  interact: boolean;
};

const MOVEMENT_KEYS: Record<string, keyof MovementState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
  KeyE: "interact",
};

const MOVEMENT_SPEED = 6;
const SPRINT_MULTIPLIER = 1.6;
const JUMP_FORCE = 4.5;

const direction = new Vector3();
const frontVector = new Vector3();
const sideVector = new Vector3();

const useKeyboardMovement = () => {
  const movementRef = useRef<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = MOVEMENT_KEYS[event.code];
      if (!key) return;
      movementRef.current[key] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = MOVEMENT_KEYS[event.code];
      if (!key) return;
      movementRef.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movementRef;
};

const Terrain = () => (
  <RigidBody type="fixed" colliders={false}>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}> 
      <planeGeometry args={[200, 200, 64, 64]} />
      <meshStandardMaterial
        color="#1f2937"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
    <CuboidCollider args={[100, 0.1, 100]} />
  </RigidBody>
);

const CraterRocks = () => {
  const rocks = useMemo(() => {
    const seed = 6;
    return new Array(12).fill(null).map((_, index) => {
      const angle = (index / 12) * Math.PI * 2;
      const radius = 8 + (index % 3);
      return {
        key: `rock-${index}`,
        position: [
          Math.cos(angle) * radius,
          0.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 0.8 + ((index * seed) % 3) * 0.3,
      };
    });
  }, []);

  return (
    <group>
      {rocks.map((rock) => (
        <RigidBody key={rock.key} type="fixed" colliders={false} position={rock.position}>
          <mesh castShadow scale={rock.scale}>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
          <CuboidCollider args={[0.9 * rock.scale, 0.6 * rock.scale, 0.9 * rock.scale]} />
        </RigidBody>
      ))}
    </group>
  );
};

const PlayerController = () => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const controls = useKeyboardMovement();
  const setPosition = usePlayerStore((state) => state.setPosition);
  const setObjectiveComplete = usePlayerStore(
    (state) => state.setObjectiveComplete
  );

  useEffect(() => {
    setObjectiveComplete("meet-guide", true);
  }, [setObjectiveComplete]);

  useFrame(() => {
    const body = rigidBody.current;
    if (!body) return;

    const velocity = body.linvel();
    frontVector.set(0, 0, Number(controls.current.backward) - Number(controls.current.forward));
    sideVector.set(Number(controls.current.left) - Number(controls.current.right), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(
        MOVEMENT_SPEED * (controls.current.sprint ? SPRINT_MULTIPLIER : 1)
      );

    if (Number.isNaN(direction.x)) {
      direction.set(0, 0, 0);
    }

    body.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    if (controls.current.jump && Math.abs(velocity.y) < 0.05) {
      body.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
    }

    const translation = body.translation();
    setPosition([translation.x, translation.y, translation.z]);
  });

  return (
    <RigidBody
      ref={rigidBody}
      position={[0, 1.2, 0]}
      colliders={false}
      mass={1}
      lockRotations
      userData={{ type: "player" }}
    >
      <CapsuleCollider args={[0.6, 0.4]} />
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 1.2, 8, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.3} roughness={0.4} />
      </mesh>
    </RigidBody>
  );
};

const TeleportDoor = ({
  position,
  label,
  targetArea,
  requirement,
  onActivate = () => undefined,
}: {
  position: [number, number, number];
  label: string;
  targetArea: string;
  requirement?: string;
  onActivate?: (areaId: string) => void;
}) => {
  const unlockedAreas = usePlayerStore(selectUnlockedAreas);
  const isAccessible = !requirement || unlockedAreas.includes(requirement);
  const unlockArea = usePlayerStore((state) => state.unlockArea);
  const setObjectiveComplete = usePlayerStore(
    (state) => state.setObjectiveComplete
  );

  const handleActivate = useCallback(() => {
    unlockArea(targetArea);
    setObjectiveComplete("activate-teleporter", true);
    onActivate(targetArea);
  }, [onActivate, setObjectiveComplete, targetArea, unlockArea]);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      userData={{ type: "teleporter", id: targetArea }}
    >
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[2.4, 4.5, 0.5]} />
        <meshStandardMaterial
          color={isAccessible ? "#22d3ee" : "#475569"}
          emissive={isAccessible ? "#0ea5e9" : "#1e293b"}
          emissiveIntensity={isAccessible ? 1.8 : 0.2}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      <Float
        speed={isAccessible ? 2 : 1}
        rotationIntensity={isAccessible ? 0.6 : 0.2}
        position={[0, 4.2, 0]}
      >
        <mesh>
          <torusGeometry args={[1.4, 0.06, 12, 48]} />
          <meshStandardMaterial
            color={isAccessible ? "#f97316" : "#64748b"}
            emissive={isAccessible ? "#fb923c" : "#1e293b"}
            emissiveIntensity={isAccessible ? 1.4 : 0.1}
          />
        </mesh>
      </Float>
      <CuboidCollider
        args={[1.2, 2.4, 0.8]}
        sensor
        onIntersectionEnter={({ other }) => {
          const userData = other.rigidBodyObject?.userData as
            | { type?: string }
            | undefined;
          if (!isAccessible || userData?.type !== "player") {
            return;
          }
          handleActivate();
        }}
      />
      <Html center position={[0, 0.8, 1.4]} distanceFactor={18}>
        <div className="rounded-md border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100 shadow-lg">
          {label}
          {!isAccessible && (
            <span className="block text-[0.65rem] font-normal text-amber-300">
              Requires {requirement}
            </span>
          )}
        </div>
      </Html>
    </RigidBody>
  );
};

const CollectibleCrystal = () => {
  const collectedItems = usePlayerStore(selectCollectedItems);
  const collectItem = usePlayerStore((state) => state.collectItem);
  const setObjectiveComplete = usePlayerStore(
    (state) => state.setObjectiveComplete
  );
  const hasCrystal = collectedItems.includes("elemental-crystal");

  const handleCollect = useCallback(() => {
    collectItem("elemental-crystal");
    setObjectiveComplete("collect-crystal", true);
  }, [collectItem, setObjectiveComplete]);

  if (hasCrystal) {
    return null;
  }

  return (
    <RigidBody type="fixed" colliders={false} position={[2, 1.5, 2]}>
      <Float speed={2.2} rotationIntensity={0.8} floatIntensity={0.6}>
        <mesh castShadow>
          <octahedronGeometry args={[0.4, 1]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={1.4}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
      </Float>
      <CuboidCollider
        args={[0.7, 0.7, 0.7]}
        sensor
        onIntersectionEnter={({ other }) => {
          const userData = other.rigidBodyObject?.userData as
            | { type?: string }
            | undefined;
          if (userData?.type === "player") {
            handleCollect();
          }
        }}
      />
      <Html distanceFactor={16} position={[0, 1.3, 0]}>
        <div className="rounded-md border border-amber-300/20 bg-slate-900/90 px-2 py-1 text-xs text-amber-200 shadow">
          Elemental Crystal
        </div>
      </Html>
    </RigidBody>
  );
};

export const HubWorldScene = () => {
  return (
    <div className="relative h-full w-full">
      <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 15, 45]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          intensity={1.1}
          position={[12, 18, 8]}
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Terrain />
            <CraterRocks />
            <PlayerController />
            <CollectibleCrystal />
            <TeleportDoor
              position={[10, 0, -6]}
              label="Crystal Cavern"
              targetArea="crystal-cavern"
            />
            <TeleportDoor
              position={[-8, 0, 12]}
              label="Sky Garden"
              targetArea="sky-garden"
              requirement="crystal-cavern"
            />
          </Physics>
          <Sky sunPosition={[30, 25, 30]} turbidity={6} mieCoefficient={0.008} />
          <Stars radius={120} depth={40} count={4000} factor={2} saturation={0} fade />
        </Suspense>
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
      <Hud />
    </div>
  );
};

export default HubWorldScene;
