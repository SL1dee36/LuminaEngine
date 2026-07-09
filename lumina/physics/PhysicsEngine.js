// physics/PhysicsEngine.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

import * as THREE from 'three';

export default class PhysicsEngine {
    constructor() {
        this.rigidBodies = [];
        this.gravity = -20.0;
    }

    addRigidBody(body) {
        this.rigidBodies.push(body);
    }

    removeRigidBody(body) {
        const index = this.rigidBodies.indexOf(body);
        if (index > -1) this.rigidBodies.splice(index, 1);
    }

    update(deltaTime) {
        if (deltaTime > 0.1) deltaTime = 0.1;

        this.rigidBodies.forEach(body => {
            // Статичные объекты стоят на месте, их не просчитываем
            if (body.bodyType === 'static') return; 

            if (body.bodyType === 'dynamic' && body.useGravity) {
                body.velocity.y += this.gravity * deltaTime;
            }

            // Y
            const nextPosY = body.position.clone();
            nextPosY.y += body.velocity.y * deltaTime;
            
            const colsY = this.getCollisions(body, nextPosY);
            if (colsY.length > 0) {
                if (body.velocity.y < 0) body.isGrounded = true;
                
                // Если есть упругость - отскакиваем, иначе останавливаемся
                if (body.restitution > 0) body.velocity.y *= -body.restitution;
                else body.velocity.y = 0;
                
                body.handleCollisions(colsY, 'Y');
            } else {
                body.position.y = nextPosY.y;
                if (body.velocity.y !== 0) body.isGrounded = false;
            }

            // X
            const nextPosX = body.position.clone();
            nextPosX.x += body.velocity.x * deltaTime;
            
            const colsX = this.getCollisions(body, nextPosX);
            if (colsX.length > 0) {
                if (body.restitution > 0) body.velocity.x *= -body.restitution;
                else body.velocity.x = 0;
                
                body.handleCollisions(colsX, 'X');
            } else {
                body.position.x = nextPosX.x;
            }

            // Friction
            if (body.isGrounded && body.friction > 0) {
                body.velocity.x *= Math.pow(1 - body.friction, deltaTime * 60);
                if (Math.abs(body.velocity.x) < 0.05) body.velocity.x = 0;
            }
        });
    }

    getCollisions(playerBody, nextPos) {
        const collisions = [];
        if (!playerBody.collider) return collisions;

        const playerBox = playerBody.collider.getBox(nextPos);
        
        playerBox.expandByScalar(-0.02);

        this.rigidBodies.forEach(otherBody => {
            if (otherBody === playerBody || !otherBody.collider) return;
            
            const otherBox = otherBody.collider.getBox(otherBody.position);
            
            if (playerBox.intersectsBox(otherBox)) {
                collisions.push(otherBody);
            }
        });
        
        return collisions;
    }
}