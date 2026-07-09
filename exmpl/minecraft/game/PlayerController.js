// author: Nazaryan A.K. 
// github: @Sl1dee36

import { Component } from '../Lumina/js/core/Component.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';

export class PlayerController extends Component {
    constructor(gameObject, settingsManager, soundManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.soundManager = soundManager;
        this.camera = null;
        this.rigidBody = null;

        this.moveSpeed = 4.5;
        this.runSpeed = 7.5;
        this.jumpForce = 7;
        this.pitch = 0;
    }

    start() {
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        this.camera = this.engine.renderer.camera;
        this.transform.add(this.camera);
        this.camera.position.set(0, 0.8, 0);
    }

    setRenderMode(mode) {
        const world = this.engine.physicsEngine.world;
        if (!world) return;
        
        const scene = this.engine.renderer.scene;
        scene.overrideMaterial = null;

        if (mode === 'wireframe') {
            world.materials.forEach(m => m.wireframe = true);
        } else if (mode === 'depth') {
            world.materials.forEach(m => m.wireframe = false);
            if (!this.depthMaterial) this.depthMaterial = new THREE.MeshDepthMaterial();
            scene.overrideMaterial = this.depthMaterial;
        } else {
            world.materials.forEach(m => m.wireframe = false);
        }
    }

    update(deltaTime) {
        if (this.transform.position.y < -30) {
            const respawnPos = new THREE.Vector3(8, 120, 8);
            this.transform.position.copy(respawnPos);
            if (this.rigidBody.physicsPosition) {
                this.rigidBody.physicsPosition.copy(respawnPos);
                this.rigidBody.prevPhysicsPosition.copy(respawnPos);
            }
            this.rigidBody.velocity.set(0, 0, 0);
        }

        const input = this.engine.inputManager;

        if (input.wasKeyJustPressed('KeyU')) this.setRenderMode('wireframe');
        if (input.wasKeyJustPressed('KeyI')) this.setRenderMode('depth');
        if (input.wasKeyJustPressed('KeyO')) this.setRenderMode('normal');

        const sensitivity = this.settings.get('sensitivity');
        const mouseDelta = input.getMouseDelta();
        
        this.transform.rotateY(-mouseDelta.x * sensitivity);
        this.pitch -= mouseDelta.y * sensitivity;
        this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.pitch));
        this.camera.rotation.x = this.pitch;

        const dir = new THREE.Vector3();
        const joyX = input.joystickInput ? input.joystickInput.x : 0;
        const joyY = input.joystickInput ? input.joystickInput.y : 0;

        if (input.isKeyDown('KeyW') || joyY < -0.3) dir.z -= 1;
        if (input.isKeyDown('KeyS') || joyY > 0.3) dir.z += 1;
        if (input.isKeyDown('KeyA') || joyX < -0.3) dir.x -= 1;
        if (input.isKeyDown('KeyD') || joyX > 0.3) dir.x += 1;

        if (dir.lengthSq() > 0) {
            dir.normalize().applyQuaternion(this.transform.quaternion);
        }

        const isSprint = input.isKeyDown('ShiftLeft') || input.isSprintingMobile;
        const speed = isSprint ? this.runSpeed : this.moveSpeed;
        
        if (this.rigidBody.isInWater) {
            this.rigidBody.velocity.x = dir.x * speed * 0.6;
            this.rigidBody.velocity.z = dir.z * speed * 0.6;
        } else {
            this.rigidBody.velocity.x = dir.x * speed;
            this.rigidBody.velocity.z = dir.z * speed;
        }

        if (input.isKeyDown('Space')) {
            if (this.rigidBody.isGrounded) {
                this.rigidBody.velocity.y = this.jumpForce;
                this.rigidBody.isGrounded = false;
                if (this.soundManager) this.soundManager.playJump();
            } else if (this.rigidBody.isInWater) {
                this.rigidBody.velocity.y = this.jumpForce * 0.85;
            }
        }
    }
}