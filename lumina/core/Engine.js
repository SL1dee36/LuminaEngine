// core/Engine.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

import * as THREE from 'three';
import Renderer from './Renderer.js';
import PhysicsEngine from '../physics/PhysicsEngine.js';
import { InputManager } from './InputManager.js';

export default class Engine {
    constructor(canvasId) {
        this.renderer = new Renderer(canvasId);
        this.physicsEngine = new PhysicsEngine();
        this.inputManager = new InputManager(this.renderer.renderer.domElement);
        
        this.gameObjects = [];
        this.lastTime = performance.now();
        this.isRunning = false;
    }

    addGameObject(gameObject) {
        gameObject.engine = this;
        
        this.gameObjects.push(gameObject);
        
        if (gameObject.mesh) {
            this.renderer.scene.add(gameObject.mesh);
        }
        
        if (gameObject.rigidBody) {
            this.physicsEngine.addRigidBody(gameObject.rigidBody);
        }
        gameObject.start();
    }


    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
            
            if (gameObject.mesh) {
                this.renderer.scene.remove(gameObject.mesh);
            }
            if (gameObject.rigidBody) {
                this.physicsEngine.removeRigidBody(gameObject.rigidBody);
            }
        }
    }

    setRenderMode(wireframeEnabled) {
        this.renderer.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = wireframeEnabled;
            }
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.gameLoop());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.physicsEngine.update(deltaTime);
        this.gameObjects.forEach(obj => obj.update(deltaTime));
        this.renderer.render();
        this.inputManager.lateUpdate(); 
    }
}