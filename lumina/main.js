// lumina/main.js
// Example entry point and quick demonstration for LuminaEngine
// author: Nazaryan A.K. 
// github: @Sl1dee36

import { Engine, GameObject, BoxCollider, RigidBody } from './index.js';
import * as THREE from 'three';

export function createDemoScene(canvasId = 'gameCanvas') {
    const engine = new Engine(canvasId);

    // Освещение сцены
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    engine.renderer.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    engine.renderer.scene.add(dirLight);

    // Пол (статический коллайдер)
    const floor = new GameObject('Floor');
    const floorGeo = new THREE.BoxGeometry(30, 1, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    floor.transform.add(floorMesh);
    floor.transform.position.set(0, -0.5, 0);
    floor.addComponent(BoxCollider, new THREE.Vector3(30, 1, 30));
    floor.addComponent(RigidBody, { bodyType: 'static' });
    engine.addGameObject(floor);

    // Физический куб (динамическое тело с гравитацией и упругостью)
    const box = new GameObject('PhysicsBox');
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    box.transform.add(boxMesh);
    box.transform.position.set(0, 10, 0);
    box.addComponent(BoxCollider, new THREE.Vector3(2, 2, 2));
    box.addComponent(RigidBody, { 
        bodyType: 'dynamic', 
        friction: 0.2, 
        restitution: 0.4, 
        useGravity: true 
    });
    engine.addGameObject(box);

    // Положение камеры
    engine.renderer.camera.position.set(0, 8, 20);
    engine.renderer.camera.lookAt(0, 2, 0);

    engine.start();
    return engine;
}

export default createDemoScene;