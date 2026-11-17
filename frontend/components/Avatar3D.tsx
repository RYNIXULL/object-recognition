"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMUtils } from "@pixiv/three-vrm";

import { LipSync } from "@/lib/lipSync";
import { subscribeAudioStart, subscribeAudioEnd } from "@/lib/store";
import type { VisemeEvent } from "@/lib/types";

export function Avatar3D({ url = "/avatars/pointer.glb" }: { url?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const lipSyncRef = useRef<LipSync>(new LipSync());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Transparent background
    scene.background = null;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      35,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      20.0,
    );
    // Adjust camera to focus on face/bust
    camera.position.set(0.0, 1.45, 1.2);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    // Batasi pixelRatio maksimal 1 atau 1.25 agar tidak lag parah saat digabung efek blur kaca
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // GLTF Loader & VRM Plugin
    const loader = new GLTFLoader();
    loader.crossOrigin = "anonymous";

    // We only register VRM plugin if we are actually loading a VRM file
    if (url.toLowerCase().endsWith(".vrm")) {
      loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    loader.load(
      url,
      (gltf) => {
        // Cek apakah ini model VRM atau GLB biasa
        const isVRM = url.toLowerCase().endsWith(".vrm");

        if (isVRM) {
          const vrm = gltf.userData.vrm as VRM;
          if (!vrm) {
            setError("Model VRM tidak valid");
            return;
          }

          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          scene.add(vrm.scene);
          vrmRef.current = vrm;

          // Setup LipSync
          if (vrm.expressionManager) {
            lipSyncRef.current.setExpressionManager(vrm.expressionManager);
          }

          // Face the camera properly
          vrm.scene.rotation.y = Math.PI;
        } else {
          // Jika GLB biasa (non-VRM)
          scene.add(gltf.scene);

          // Sesuaikan rotasi, scale, dan posisi standar untuk GLB
          // Karena bukan VRM humanoid standar, kita perlu menyesuaikan agar tampil di tengah kamera

          // Kalkulasi bounding box agar bisa centering model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Reset posisi ke tengah bawah
          gltf.scene.position.x += gltf.scene.position.x - center.x;
          gltf.scene.position.y += gltf.scene.position.y - box.min.y; // Letakkan kaki di y=0
          gltf.scene.position.z += gltf.scene.position.z - center.z;

          // Sesuaikan kamera agar fokus ke object tersebut
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

          camera.position.set(0, size.y / 2, cameraZ * 1.5); // Lihat ke tengah model
          camera.lookAt(0, size.y / 2, 0);

          // Animasi default karena tidak ada vrm.humanoid
          // Opsional: kita bisa pasang animasi melayang/berputar kalau mau
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load VRM", err);
        setError("Gagal memuat model Avatar");
        setLoading(false);
      },
    );

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Handle VRM updates (jika modelnya adalah VRM)
      if (vrmRef.current) {
        vrmRef.current.update(delta);
        lipSyncRef.current.update(delta);

        // Idle animation for the head
        if (vrmRef.current.humanoid) {
          const head = vrmRef.current.humanoid.getNormalizedBoneNode("head");
          if (head) {
            // Subtle head movement
            head.rotation.x = Math.sin(time * 0.5) * 0.05;
            head.rotation.y = Math.sin(time * 0.3) * 0.05;
            head.rotation.z = Math.cos(time * 0.4) * 0.02;
          }
        }
      } else if (!loading && !error) {
        // Handle animasi idle GLB biasa (Berputar perlahan & melayang sedikit)
        const sceneModel = scene.children.find(
          (child) => child.type === "Group",
        );
        if (sceneModel) {
          sceneModel.rotation.y = time * 0.2; // berputar perlahan
          // sedikit melayang
          const currentY = sceneModel.position.y;
          // Gunakan offset yang diset saat load, kalau tidak ada set 0
          sceneModel.position.y += Math.sin(time * 2) * 0.001;
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [url]);

  // Lip-sync integration via store subscribers
  useEffect(() => {
    let currentAudio: HTMLAudioElement | null = null;
    let currentVisemes: VisemeEvent[] = [];
    let rafId: number;

    const syncLip = () => {
      if (currentAudio && !currentAudio.paused) {
        const timeMs = currentAudio.currentTime * 1000;
        // Find the active viseme
        const active = currentVisemes.find(
          (v) => timeMs >= v.time && timeMs < v.time + v.duration,
        );
        if (active) {
          lipSyncRef.current.setViseme(active.phoneme);
        } else {
          lipSyncRef.current.reset();
        }
      }
      rafId = requestAnimationFrame(syncLip);
    };

    const unsubStart = subscribeAudioStart((audioEl, visemes) => {
      currentAudio = audioEl;
      currentVisemes = visemes;
      lipSyncRef.current.reset();
    });

    const unsubEnd = subscribeAudioEnd(() => {
      currentAudio = null;
      currentVisemes = [];
      lipSyncRef.current.reset();
    });

    rafId = requestAnimationFrame(syncLip);

    return () => {
      unsubStart();
      unsubEnd();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 animate-pulse">
          Memuat Avatar...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
          {error}
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
