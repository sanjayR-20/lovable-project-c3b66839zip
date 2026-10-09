import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type ViewerMode = "overlay" | "blueprint" | "scan";

type ThreeModelProps = { mode: ViewerMode };

export function ThreeModel({ mode }: ThreeModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      const webglAvailable = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!webglAvailable) {
        setUnavailable(true);
        return;
      }
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x151b1f, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
    camera.position.set(6.7, 5.3, 8.2);
    camera.lookAt(0, 1.05, 0);
    scene.add(new THREE.HemisphereLight(0xb4d1d2, 0x293039, 2.25));
    const key = new THREE.DirectionalLight(0xe6f1f0, 2.2);
    key.position.set(4, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x56cbd0, 0.7);
    fill.position.set(-5, 4, -3);
    scene.add(fill);

    const model = new THREE.Group();
    scene.add(model);
    const planned = new THREE.Group();
    const actual = new THREE.Group();
    const delayed = new THREE.Group();
    model.add(planned, actual, delayed);

    const cyan = new THREE.MeshBasicMaterial({ color: 0x48d2d2, wireframe: true, transparent: true, opacity: 0.76 });
    const gray = new THREE.MeshStandardMaterial({ color: 0x839097, roughness: 0.84, metalness: 0.08 });
    const slab = new THREE.MeshStandardMaterial({ color: 0x647178, roughness: 0.88, metalness: 0.05 });
    const red = new THREE.MeshStandardMaterial({ color: 0xef736c, transparent: true, opacity: 0.47, roughness: 0.7 });
    const delayedWire = new THREE.MeshBasicMaterial({ color: 0xf2837a, wireframe: true, transparent: true, opacity: 0.85 });
    const sizes = { width: 3.5, depth: 2.8, height: 2.55, post: 0.19 };
    const corners: [number, number][] = [
      [-sizes.width / 2, -sizes.depth / 2],
      [sizes.width / 2, -sizes.depth / 2],
      [-sizes.width / 2, sizes.depth / 2],
      [sizes.width / 2, sizes.depth / 2],
    ];

    const addBox = (group: THREE.Group, geometry: THREE.BoxGeometry, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      group.add(mesh);
    };
    const buildFrame = (group: THREE.Group, material: THREE.Material, omitPillar = -1, omitRoof = false) => {
      const baseGeom = new THREE.BoxGeometry(sizes.width + 0.26, 0.16, sizes.depth + 0.26);
      addBox(group, baseGeom, material, 0, 0.08, 0);
      corners.forEach(([x, z], index) => {
        if (index === omitPillar) return;
        addBox(group, new THREE.BoxGeometry(sizes.post, sizes.height, sizes.post), material, x, sizes.height / 2 + 0.17, z);
      });
      if (!omitRoof) addBox(group, new THREE.BoxGeometry(sizes.width + 0.22, 0.18, sizes.depth + 0.22), material, 0, sizes.height + 0.25, 0);
    };
    buildFrame(planned, cyan);
    buildFrame(actual, gray, 2, true);
    buildFrame(delayed, red, -1, false);
    buildFrame(delayed, delayedWire, -1, false);
    // The red target geometry is limited to the missing south-west post and roof.
    delayed.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const x = mesh.position.x;
      const y = mesh.position.y;
      const isRoof = y > sizes.height;
      const isBase = y < 0.2;
      const isMissingPost = !isRoof && !isBase && x < 0 && mesh.position.z > 0;
      mesh.visible = isRoof || isMissingPost;
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      new THREE.MeshBasicMaterial({ color: 0x1b2429, transparent: true, opacity: 0.54, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    model.add(floor);
    const axes = new THREE.AxesHelper(0.45);
    axes.position.set(-2.45, 0.03, 1.7);
    scene.add(axes);

    planned.visible = mode === "blueprint" || mode === "overlay";
    actual.visible = mode === "scan" || mode === "overlay";
    delayed.visible = mode === "overlay";
    if (mode === "blueprint") actual.visible = false;

    let frame = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const animate = () => {
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    const down = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      model.rotation.y += (event.clientX - previousX) * 0.009;
      model.rotation.x = THREE.MathUtils.clamp(model.rotation.x + (event.clientY - previousY) * 0.004, -0.22, 0.3);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const up = () => { dragging = false; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [mode]);

  return (
    <>
      <canvas ref={canvasRef} className="scene-canvas" aria-label="Interactive structural 3D model. Drag to rotate." />
      {unavailable && (
        <div className="webgl-fallback" role="status">
          <strong>3D preview unavailable</strong>
          <span>WebGL is disabled in this browser. Scan metrics and schedule remain available.</span>
        </div>
      )}
    </>
  );
}
