import * as THREE from 'three';
import { Engine, GameObject, Component, BoxCollider, RigidBody } from '../../lumina/index.js';

class PlayerController extends Component {
    constructor(gameObject, speed = 8.0) {
        super(gameObject);
        this.speed = speed;
        this.rigidBody = null;
    }

    start() {
        this.rigidBody = this.gameObject.getComponent(RigidBody);
    }

    update(deltaTime) {
        if (!this.rigidBody) return;

        const input = this.engine.inputManager;
        let moveX = 0;
        let moveZ = 0;

        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) moveZ -= 1;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) moveZ += 1;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) moveX -= 1;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            this.rigidBody.velocity.x = (moveX / length) * this.speed;
            this.rigidBody.velocity.z = (moveZ / length) * this.speed;
        }

        if (input.isKeyDown('Space') && this.rigidBody.isGrounded) {
            this.rigidBody.velocity.y = 8.0;
            this.rigidBody.isGrounded = false;
        }
    }
}

class Rotator extends Component {
    constructor(gameObject, speed = 1.0) {
        super(gameObject);
        this.speed = speed;
    }

    update(deltaTime) {
        this.transform.rotation.y += this.speed * deltaTime;
        this.transform.rotation.x += this.speed * 0.5 * deltaTime;
    }
}

function init() {
    const engine = new Engine('gameCanvas');

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    engine.renderer.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    engine.renderer.scene.add(dirLight);

    // Статический пол
    const floor = new GameObject('Floor');
    const floorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(40, 1, 40),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
    );
    floorMesh.receiveShadow = true;
    floor.transform.add(floorMesh);
    floor.transform.position.set(0, -0.5, 0);
    floor.addComponent(BoxCollider, new THREE.Vector3(40, 1, 40));
    floor.addComponent(RigidBody, { bodyType: 'static' });
    engine.addGameObject(floor);

    // Управляемый игрок
    const player = new GameObject('Player');
    const playerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.8, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x27ae60 })
    );
    playerMesh.castShadow = true;
    player.transform.add(playerMesh);
    player.transform.position.set(0, 5, 0);
    player.addComponent(BoxCollider, new THREE.Vector3(1.2, 1.8, 1.2));
    player.addComponent(RigidBody, {
        bodyType: 'dynamic',
        friction: 0.15,
        restitution: 0.0,
        useGravity: true
    });
    player.addComponent(PlayerController, 10.0);
    engine.addGameObject(player);
    engine.setPlayer(player);

    // Препятствия и декоративные физические кубы
    for (let i = 0; i < 5; i++) {
        const obstacle = new GameObject(`Obstacle_${i}`);
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({ color: 0xe67e22 })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        obstacle.transform.add(mesh);
        obstacle.transform.position.set((i - 2) * 5, 1, -8);
        obstacle.addComponent(BoxCollider, new THREE.Vector3(2, 2, 2));
        obstacle.addComponent(RigidBody, { bodyType: 'static' });
        engine.addGameObject(obstacle);
    }

    // Вращающийся декоративный куб
    const spinner = new GameObject('Spinner');
    const spinMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
    );
    spinMesh.castShadow = true;
    spinner.transform.add(spinMesh);
    spinner.transform.position.set(0, 3, -8);
    spinner.addComponent(Rotator, 1.5);
    engine.addGameObject(spinner);

    // Настройка камеры (вид от третьего лица сверху под углом)
    engine.renderer.camera.position.set(0, 14, 18);
    engine.renderer.camera.lookAt(0, 1, 0);

    engine.start();
}

window.addEventListener('DOMContentLoaded', init);
