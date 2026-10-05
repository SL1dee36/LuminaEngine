# LuminaEngine

LuminaEngine — легковесный трехмерный игровой движок для веб-платформы, функционирующий поверх Three.js. Движок реализует компонентную архитектуру (Entity-Component), дискретную физическую симуляцию на базе AABB-коллайдеров и централизованную подсистему обработки пользовательского ввода для настольных и мобильных браузеров.

## Технические характеристики

* Версия ядра: 1.4.1.
* Базовая графическая библиотека: Three.js (r160+).
* Архитектурный паттерн: Entity-Component-System (контейнерная модель `GameObject` + `Component`).
* Подсистема рендеринга: WebGLRenderer с поддержкой теней (PCFSoftShadowMap), автоматической адаптацией под плотность пикселей (`devicePixelRatio`) и ресайзом вьюпорта.
* Физический движок: дискретная интеграция Эйлера, AABB-коллизии по трем пространственным осям (X, Y, Z), поддержка гравитации, трения скольжения и коэффициента упругости (restitution).
* Подсистема ввода: Pointer Lock API, обработка клавиатуры, мыши, колеса прокрутки, сенсорных жестов и виртуального экранного джойстика.
* Модульная система: нативные ECMAScript-модули (ESM).

## Структура репозитория

```
LuminaEngine/
├── lumina/
│   ├── index.js                  Точка входа библиотеки (экспорт всех модулей)
│   ├── lu.version                Файл версии ядра
│   ├── main.js                   Пример программной сборки сцены
│   ├── core/
│   │   ├── Component.js          Базовый класс компонентов
│   │   ├── Engine.js             Главный класс управления жизненным циклом и циклом рендера
│   │   ├── GameObject.js         Сущность сцены (контейнер компонентов и пространственных данных)
│   │   ├── InputManager.js       Централизованный диспетчер ввода (мышь, клавиатура, касания)
│   │   ├── Renderer.js           Обертка WebGL-контекста Three.js, камеры и сцены
│   │   └── TouchControls.js      Обработчик мобильного ввода и виртуального джойстика
│   └── physics/
│       ├── Colliders.js          Коллайдеры (BoxCollider, HeightfieldCollider)
│       ├── PhysicsEngine.js      Дискретный симулятор физики и столкновений
│       └── RigidBody.js          Компонент твердого тела
├── exmpl/
│   ├── basic/                    Минималистичный базовый пример работы движка
│   │   ├── index.html
│   │   └── main.js
│   └── minecraft/                Комплексный демонстрационный проект воксельной песочницы
│       ├── index.html
│       ├── game/
│       └── Lumina/
├── README.md                     Основное описание проекта
├── doc_ru.md                     Полная техническая спецификация API
└── .hintrc                       Конфигурация линтера
```

## Быстрый старт

### 1. Подключение разметки HTML

Для функционирования движка требуется элемент `<canvas>` и карта импортов (importmap) для Three.js.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LuminaEngine App</title>
    <style>
        body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
        #gameCanvas { width: 100%; height: 100%; display: block; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>

    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script type="module" src="./main.js"></script>
</body>
</html>
```

### 2. Инициализация и создание сцены

```javascript
import * as THREE from 'three';
import { Engine, GameObject, BoxCollider, RigidBody, Component } from './lumina/index.js';

// 1. Инициализация ядра движка
const engine = new Engine('gameCanvas');

// 2. Настройка освещения
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
engine.renderer.scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
engine.renderer.scene.add(dirLight);

// 3. Создание статической поверхности
const floor = new GameObject('Floor');
const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
floorMesh.receiveShadow = true;
floor.transform.add(floorMesh);
floor.transform.position.set(0, -0.5, 0);
floor.addComponent(BoxCollider, new THREE.Vector3(20, 1, 20));
floor.addComponent(RigidBody, { bodyType: 'static' });
engine.addGameObject(floor);

// 4. Создание динамического физического объекта
const box = new GameObject('Box');
const boxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x2980b9 })
);
boxMesh.castShadow = true;
box.transform.add(boxMesh);
box.transform.position.set(0, 8, 0);
box.addComponent(BoxCollider, new THREE.Vector3(1.5, 1.5, 1.5));
box.addComponent(RigidBody, {
    bodyType: 'dynamic',
    friction: 0.2,
    restitution: 0.3,
    useGravity: true
});
engine.addGameObject(box);

// 5. Позиционирование камеры и запуск цикла
engine.renderer.camera.position.set(0, 6, 12);
engine.renderer.camera.lookAt(0, 1, 0);
engine.start();
```

### 3. Разработка пользовательского компонента

Каждый компонент наследуется от базового класса `Component` и реализует методы жизненного цикла `start()` и `update(deltaTime)`:

```javascript
class MoverComponent extends Component {
    constructor(gameObject, speed = 5.0) {
        super(gameObject);
        this.speed = speed;
    }

    start() {
        // Вызывается однократно при регистрации объекта в движке
    }

    update(deltaTime) {
        // Вызывается на каждом кадре перед рендером
        const input = this.engine.inputManager;
        if (input.isKeyDown('KeyW')) {
            this.transform.position.z -= this.speed * deltaTime;
        }
        if (input.isKeyDown('KeyS')) {
            this.transform.position.z += this.speed * deltaTime;
        }
    }
}

box.addComponent(MoverComponent, 4.0);
```

## Документация

Подробная техническая спецификация архитектуры, всех классов, методов, типов данных и жизненного цикла доступна в файле [doc_ru.md](doc_ru.md).
