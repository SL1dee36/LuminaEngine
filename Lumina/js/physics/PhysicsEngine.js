// physics/PhysicsEngine.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

import * as THREE from 'three';

export default class PhysicsEngine {
    constructor() {
        this.rigidBodies = [];
        this.gravity = -9.81;
    }

    addRigidBody(body) {
        this.rigidBodies.push(body);
    }

    removeRigidBody(body) {
        const index = this.rigidBodies.indexOf(body);
        if (index > -1) {
            this.rigidBodies.splice(index, 1);
        }
    }

    update(deltaTime) {
        this.rigidBodies.forEach(body => {
            if (body.bodyType === 'dynamic') {
                body.velocity.y += this.gravity * deltaTime;
                const nextPos = body.position.clone().add(body.velocity.clone().multiplyScalar(deltaTime));
                const collisions = this.getCollisions(body, nextPos);
                
                if (collisions.length > 0) {
                    body.velocity.y = 0;
                    body.isGrounded = true;
                    // TODO: Реализовать полноценное выталкивание (Slide/Resolve) по всем осям
                } else {
                    body.position.copy(nextPos);
                    body.isGrounded = false;
                }
            }
        });
    }

    getCollisions(playerBody, nextPos) {
        const collisions = [];
        
        if (!playerBody.boxCollider) return collisions;
        const playerBox = playerBody.boxCollider.clone().translate(nextPos);

        this.rigidBodies.forEach(otherBody => {
            if (otherBody === playerBody || !otherBody.boxCollider) return;
            const otherBox = otherBody.boxCollider.clone().translate(otherBody.position);
            if (playerBox.intersectsBox(otherBox)) {
                collisions.push(otherBody);
            }
        });
        
        return collisions;
    }
}