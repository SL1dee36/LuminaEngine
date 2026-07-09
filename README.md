# LuminaEngine

LuminaEngine — это 3D-игровой движок, построенный поверх Three.js. Движок использует паттерн Entity-Component-System (ECS) для управления игровой логикой и включает в себя встроенные модули для рендеринга, обработки физики и управления пользовательским вводом.

## Основные возможности

* **Архитектура ECS**: Гибкая система игровых объектов (`GameObject`) и компонентов, позволяющая легко расширять функционал.
* **Рендеринг**: Интеграция с Three.js с поддержкой теней и различных режимов отображения (включая wireframe и depth map).
* **Физика**: Встроенный физический движок с поддержкой твердых тел (`RigidBody`) и коллайдеров.
* **Ввод**: Обработка событий клавиатуры, мыши и сенсорных экранов (`InputManager`, `TouchControls`).
* **Модульность**: Разделение на ядро, физику и игровую логику.

## Быстрый старт и примеры API

Ниже приведены базовые примеры использования ядра движка. Полная и подробная документация находится в стадии разработки.

### 1. Инициализация движка

Для начала работы необходимо создать экземпляр класса `Engine`, передав ему ID HTML-элемента canvas.

```javascript
import { Engine } from './js/core/Engine.js';

// Инициализация движка с привязкой к элементу <canvas id="game-canvas"></canvas>
const engine = new Engine('game-canvas');

```

### 2. Создание игровых объектов и компонентов

Вся логика строится вокруг экземпляров `GameObject`. Поведение объектов определяется добавленными к ним компонентами.

```javascript
import { GameObject } from './js/core/GameObject.js';
import { RigidBody } from './js/physics/RigidBody.js';
import { BoxCollider } from './js/physics/Colliders.js';

// Создание нового игрового объекта
const player = new GameObject('Player');

// Добавление компонентов. 
// Метод addComponent принимает класс компонента и любые дополнительные аргументы для его конструктора.
player.addComponent(RigidBody, { bodyType: 'dynamic' });
player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));

// Установка позиции через встроенный transform (Three.js Object3D)
player.transform.position.set(0, 10, 0);

```

### 3. Создание пользовательского компонента

Вы можете создавать свои компоненты, расширяя базовый функционал. Каждый компонент имеет доступ к объекту, к которому он прикреплен, и к жизненному циклу (`start`, `update`).

```javascript
export class CustomPlayerController {
    constructor(gameObject, speed) {
        this.gameObject = gameObject;
        this.speed = speed;
    }

    start() {
        // Вызывается один раз при старте
        console.log(`${this.gameObject.name} initialized with speed ${this.speed}`);
    }

    update(deltaTime) {
        // Вызывается каждый кадр
        // Пример использования менеджера ввода из движка:
        if (this.gameObject.engine.inputManager.isKeyPressed('KeyW')) {
            this.gameObject.transform.position.z -= this.speed * deltaTime;
        }
    }
}

// Добавление пользовательского компонента
player.addComponent(CustomPlayerController, 5.0);

```

### 4. Запуск игрового цикла

После настройки всех объектов, их необходимо добавить в движок и запустить главный цикл.

```javascript
// Добавление объекта в массив обрабатываемых сущностей и на сцену
engine.addGameObject(player);

// Опционально: установка объекта в качестве главного игрока
engine.setPlayer(player);

// Запуск игрового цикла (gameLoop)
engine.start();

```

## Документация

Упрощенная документация на Русском языке: [ Открыть техническую документацию ](https://github.com/SL1dee36/LuminaEngine/blob/main/doc_ru.md)

*Полноценная документация по классам, физическому движку, генерации мира и другим подсистемам находится в разработке и будет добавлена позже.*
