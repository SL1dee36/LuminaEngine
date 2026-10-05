# Техническая документация LuminaEngine

Данный документ содержит полное архитектурное описание и спецификацию API веб-движка LuminaEngine (версия 1.4.1).

---

## 1. Архитектурный обзор

LuminaEngine построен на базе библиотеки Three.js и реализует компонентную архитектуру (Entity-Component), совмещенную с дискретным физическим симулятором и централизованной системой ввода.

### Порядок выполнения игрового цикла (Execution Order)

Каждый кадр игрового цикла (`Engine.prototype.gameLoop`) выполняется в строгой последовательности:

```
[ requestAnimationFrame ]
          │
          ▼
[ Расчет deltaTime с отсечением скачков (макс. 0.1 с) ]
          │
          ▼
[ PhysicsEngine.update(deltaTime) ]
  ├── Интеграция гравитации для dynamic-тел
  ├── Шаг перемещения и проверка коллизий по оси Y
  ├── Шаг перемещения и проверка коллизий по оси X
  ├── Шаг перемещения и проверка коллизий по оси Z
  └── Применение поверхностного трения по осям X и Z
          │
          ▼
[ GameObject.update(deltaTime) для всех зарегистрированных сущностей ]
  └── Последовательный вызов Component.update(deltaTime)
          │
          ▼
[ Renderer.render() ]
  └── Отрисовка Three.js Scene через Three.js PerspectiveCamera
          │
          ▼
[ InputManager.lateUpdate() ]
  ├── Синхронизация текущего состояния кнопок в lastKeys / lastMouseButtons
  └── Обнуление относительных смещений курсора (mouseDelta, touchDelta, scrollDelta)
```

---

## 2. Подсистема ядра (Core)

### 2.1 Класс `Engine`

Расположение: `lumina/core/Engine.js`.
Назначение: Управление жизненным циклом симуляции, координация подсистем рендеринга, физики и ввода.

#### Конструктор
`constructor(canvasId: String | HTMLCanvasElement)`
* `canvasId` — идентификатор элемента `<canvas>` в DOM либо прямая ссылка на DOM-элемент.

#### Свойства экземпляра
| Свойство | Тип данных | Описание |
| :--- | :--- | :--- |
| `renderer` | `Renderer` | Экземпляр подсистемы рендеринга Three.js. |
| `physicsEngine` | `PhysicsEngine` | Экземпляр физического симулятора. |
| `inputManager` | `InputManager` | Диспетчер пользовательского ввода. |
| `gameObjects` | `Array<GameObject>` | Список всех зарегистрированных в движке игровых объектов. |
| `player` | `GameObject \| null` | Ссылка на основной объект игрока (опционально). |
| `lastTime` | `Number` | Временная метка предыдущего кадра в миллисекундах (`performance.now()`). |
| `isRunning` | `Boolean` | Флаг активности главного игрового цикла. |

#### Методы
| Метод | Параметры | Возвращаемое значение | Описание |
| :--- | :--- | :--- | :--- |
| `setPlayer(gameObject)` | `gameObject: GameObject` | `void` | Назначает переданный объект в качестве основного игрока (`this.player`). |
| `addGameObject(gameObject)` | `gameObject: GameObject` | `GameObject` | Добавляет объект в симуляцию: привязывает ссылку `engine`, добавляет `gameObject.transform` в сцену рендера, регистрирует `RigidBody` (при наличии) в физическом движке, вызывает `gameObject.start()`. |
| `removeGameObject(gameObject)` | `gameObject: GameObject` | `void` | Удаляет объект из списка, исключает его `transform` из сцены и `RigidBody` из физической симуляции. |
| `setRenderMode(wireframeEnabled)` | `wireframeEnabled: Boolean` | `void` | Рекурсивно обходит материалы всех мешей в сцене Three.js и переключает режим отображения каркаса (wireframe). |
| `start()` | — | `void` | Запускает главный игровой цикл `gameLoop()`, если он не был запущен ранее. |
| `stop()` | — | `void` | Останавливает выполнение игрового цикла. |
| `gameLoop()` | — | `void` | Внутренний метод покадровой итерации. Планирует следующий вызов через `requestAnimationFrame`. |

---

### 2.2 Класс `GameObject`

Расположение: `lumina/core/GameObject.js`.
Назначение: Базовая сущность сцены (Entity). Служит контейнером пространственных координат и набора компонентов.

#### Конструктор
`constructor(name: String = 'GameObject')`
* `name` — символическое имя объекта для идентификации и отладки.

#### Свойства экземпляра
| Свойство | Тип данных | Описание |
| :--- | :--- | :--- |
| `name` | `String` | Имя сущности. |
| `transform` | `THREE.Object3D` | Нода графа сцены Three.js, содержащая позицию (`position`), вращение (`rotation` / `quaternion`) и масштаб (`scale`). |
| `components` | `Array<Component>` | Массив прикрепленных к объекту компонентов. |
| `engine` | `Engine \| null` | Ссылка на экземпляр движка, проставляемая при `engine.addGameObject()`. |
| `rigidBody` | `RigidBody \| undefined` | Ссылка на компонент физического тела (кэшируется при наличии). |

#### Методы
| Метод | Параметры | Возвращаемое значение | Описание |
| :--- | :--- | :--- | :--- |
| `addComponent(ComponentClass, ...args)` | `ComponentClass: Class, ...args: Any` | `Component` | Создает экземпляр переданного класса компонента, передавая ссылку на текущий `GameObject` первым аргументом, регистрирует его в списке и возвращает созданный объект. |
| `getComponent(ComponentClass)` | `ComponentClass: Class` | `Component \| undefined` | Выполняет линейный поиск и возвращает первый компонент, являющийся экземпляром `ComponentClass` (`instanceof`). |
| `start()` | — | `void` | Передает ссылку `this.engine` во все прикрепленные компоненты и инициирует вызов их метода `start()`. |
| `update(deltaTime)` | `deltaTime: Number` | `void` | Итерируется по всем компонентам и вызывает метод `update(deltaTime)`. |

---

### 2.3 Класс `Component`

Расположение: `lumina/core/Component.js`.
Назначение: Базовый класс для всех скриптов логики, контроллеров и физических описателей.

#### Конструктор
`constructor(gameObject: GameObject)`
* `gameObject` — сущность, к которой монтируется компонент.

#### Свойства экземпляра
| Свойство | Тип данных | Описание |
| :--- | :--- | :--- |
| `gameObject` | `GameObject` | Ссылка на родительский объект. |
| `transform` | `THREE.Object3D` | Прямая ссылка на пространственный узел родителя (`gameObject.transform`). |
| `engine` | `Engine \| null` | Ссылка на экземпляр движка (актуализируется при добавлении на сцену). |

#### Методы жизненного цикла
* `start()`: Вызывается однократно при добавлении `GameObject` в движок или при вызове `start()`. Предназначен для разрешения зависимостей (`getComponent`), инициализации ресурсов и подписок.
* `update(deltaTime)`: Вызывается на каждом кадре симуляции перед этапом рендеринга.
  * Параметр `deltaTime: Number` — время, прошедшее с предыдущего кадра, в секундах.

---

### 2.4 Класс `Renderer`

Расположение: `lumina/core/Renderer.js`.
Назначение: Управление графическим выводом, камерой, сценой Three.js и обработкой изменений размера окна.

#### Конструктор
`constructor(canvasId: String | HTMLCanvasElement)`
* Находит канвас по переданному идентификатору или ссылке, создает `THREE.WebGLRenderer` с включенным сглаживанием (`antialias: true`), инициализирует сцену (`THREE.Scene`) и перспективную камеру (`THREE.PerspectiveCamera`, FOV: 75, near: 0.1, far: 1000). Включает расчет теней (`shadowMap.enabled = true`). Навешивает слушатель события `resize` окна браузера.

#### Свойства экземпляра
| Свойство | Тип данных | Описание |
| :--- | :--- | :--- |
| `renderer` | `THREE.WebGLRenderer` | Инстанс WebGL-рендерера Three.js. |
| `domElement` | `HTMLCanvasElement` | DOM-элемент канваса (`this.renderer.domElement`). |
| `scene` | `THREE.Scene` | Корневой граф сцены Three.js. |
| `camera` | `THREE.PerspectiveCamera` | Активная камера рендеринга. |

#### Методы
| Метод | Параметры | Возвращаемое значение | Описание |
| :--- | :--- | :--- | :--- |
| `onWindowResize()` | — | `void` | Обновляет соотношение сторон камеры (`camera.aspect`), матрицу проекции (`camera.updateProjectionMatrix`) и габариты буфера вывода рендерера по размерам окна `window.innerWidth` / `window.innerHeight`. |
| `render()` | — | `void` | Выполняет отрисовку сцены `this.scene` через камеру `this.camera`. |

---

## 3. Подсистема ввода (Input System)

### 3.1 Класс `InputManager`

Расположение: `lumina/core/InputManager.js`.
Назначение: Кроссплатформенный сбор данных о состоянии клавиш, кнопок мыши, указателя, колеса прокрутки и сенсорных пальцев.

#### Конструктор
`constructor(targetElement: HTMLElement)`
* `targetElement` — элемент, к которому привязывается запрос Pointer Lock (обычно `canvas`).

#### Свойства экземпляра
| Свойство | Тип данных | Описание |
| :--- | :--- | :--- |
| `keys` | `Object<String, Boolean>` | Словарь текущего состояния клавиш клавиатуры (`e.code`). |
| `lastKeys` | `Object<String, Boolean>` | Состояние клавиш на предыдущем кадре. |
| `mouseButtons` | `Object<Number, Boolean>` | Состояние кнопок мыши (0: ЛКМ, 1: СКМ, 2: ПКМ). |
| `lastMouseButtons` | `Object<Number, Boolean>` | Состояние кнопок мыши на предыдущем кадре. |
| `mouseDelta` | `{ x: Number, y: Number }` | Смещение курсора мыши за текущий кадр в пикселях. |
| `scrollDelta` | `Number` | Направление и смещение вертикального скролла (`Math.sign(e.deltaY)`). |
| `touchDelta` | `{ x: Number, y: Number }` | Смещение сенсорного указателя обзора за кадр. |
| `mousePos` | `THREE.Vector2` | Нормализованные координаты курсора в пространстве экрана (-1 .. +1). |
| `joystickInput` | `{ x: Number, y: Number }` | Вектор отклонения виртуального мобильного джойстика (-1 .. +1). |
| `isPaused` | `Boolean` | Флаг нахождения в состоянии паузы (блокирует захват курсора). |
| `isUIOpen` | `Boolean` | Флаг активности модальных окон интерфейса. |

#### Методы опроса состояния
| Метод | Сигнатура | Возврат | Описание |
| :--- | :--- | :--- | :--- |
| `isKeyDown` | `(code: String)` | `Boolean` | Возвращает `true`, если клавиша с кодом `code` удерживается. Учитывает маппинг отклонения виртуального джойстика на виртуальные клавиши `KeyW`, `KeyS`, `KeyA`, `KeyD`. |
| `wasKeyJustPressed` | `(code: String)` | `Boolean` | Возвращает `true` строго в первый кадр нажатия клавиши. |
| `isMouseButtonDown` | `(button: Number)` | `Boolean` | Возвращает `true`, если кнопка мыши (0, 1 или 2) зажата. |
| `wasMouseButtonJustPressed` | `(button: Number)` | `Boolean` | Возвращает `true` только в кадр первого нажатия кнопки мыши. |
| `getMouseDelta` | `()` | `{ x: Number, y: Number }` | Возвращает суммарное смещение указателя за кадр (комбинация `mouseDelta` и `touchDelta`). |
| `lock` | `()` | `void` | Запрашивает активацию Pointer Lock для целевого элемента (на десктопе). |
| `unlock` | `()` | `void` | Снимает захват Pointer Lock (`document.exitPointerLock()`). |
| `setPaused` | `(paused: Boolean)` | `void` | Устанавливает флаг паузы и при `true` освобождает курсор. |
| `setJoystickInput` | `(x: Number, y: Number)` | `void` | Записывает нормализованный вектор с мобильного стика. |
| `addTouchDelta` | `(dx: Number, dy: Number)` | `void` | Добавляет смещение сенсорного обзора. |
| `lateUpdate` | `()` | `void` | Внутренний метод: синхронизирует слепки состояний клавиш и обнуляет дельты перемещения. |

---

### 3.2 Класс `TouchControls`

Расположение: `lumina/core/TouchControls.js`.
Назначение: Эмуляция аналогового стика и кнопок действий для экранов с тач-интерфейсом.

#### Конструктор
`constructor(inputManager: InputManager, uiManager: Object)`
* При обнаружении мобильного устройства инициализирует сенсорные слушатели на элементах `#joystick-zone`, `#btn-jump`, `#btn-run`, `#btn-inv-mobile`, `#btn-pause-mobile`. Содержит защитные проверки на существование элементов в DOM.

#### Алгоритм обработки жестов
* Движение по области обзора с превышением порога `dragThreshold` (15 px) классифицируется как вращение камеры (`addTouchDelta`).
* Удержание пальца на месте дольше `holdThreshold` (250 мс) без смещения распознается как длительное нажатие (эмуляция зажатой ЛКМ для разрушения блоков).
* Быстрое касание без смещения распознается как одиночный клик (эмуляция ПКМ для установки блока или взаимодействия).

---

## 4. Физическая подсистема (Physics System)

### 4.1 Класс `PhysicsEngine`

Расположение: `lumina/physics/PhysicsEngine.js`.
Назначение: Расчет линейного движения, гравитационного ускорения, поверхностного трения и отскока твердых тел на основе ограничивающих параллелепипедов (AABB).

#### Конструктор
`constructor()`
* Инициализирует пустой массив `rigidBodies = []` и базовую гравитацию `gravity = -20.0` (м/с²).

#### Параметры симуляции
| Поле | Тип | По умолчанию | Описание |
| :--- | :--- | :--- | :--- |
| `gravity` | `Number` | `-20.0` | Ускорение свободного падения по вертикальной оси Y. |
| `rigidBodies` | `Array<RigidBody>` | `[]` | Список активных физических тел. |

#### Методы
| Метод | Параметры | Описание |
| :--- | :--- | :--- |
| `addRigidBody(body)` | `body: RigidBody` | Добавляет тело в массив симуляции. |
| `removeRigidBody(body)` | `body: RigidBody` | Исключает тело из симуляции. |
| `update(deltaTime)` | `deltaTime: Number` | Выполняет один такт симуляции: ограничивает `deltaTime` значением 0.1 с, обновляет скорости под действием гравитации, рассчитывает поочередное перемещение и коллизии по осям Y, X, Z, гасит горизонтальную скорость трением при контакте с опорой (`isGrounded = true`). |
| `getCollisions(playerBody, nextPos)` | `playerBody: RigidBody, nextPos: THREE.Vector3` | Возвращает список всех тел из `rigidBodies`, чьи коллайдеры пересекаются с AABB текущего тела в позиции `nextPos`. |

#### Алгоритм поосного разрешения коллизий (Axis-Separated Collision Resolution)
Для предотвращения артефактов "залипания" на углах и обеспечения скольжения вдоль стен (wall sliding) движок рассчитывает движение раздельно:
1. **Ось Y**: Рассчитывается `nextPosY = pos.y + velocity.y * dt`. Если обнаружено пересечение:
   * При движении вниз (`velocity.y < 0`) флаг `isGrounded` переводится в `true`.
   * Применяется упругость (`velocity.y *= -restitution`) либо остановка (`velocity.y = 0`).
   * Вызывается событие столкновения: `body.handleCollisions(colsY, 'Y')`.
2. **Ось X**: Рассчитывается `nextPosX = pos.x + velocity.x * dt`. При пересечении скорость гасится или отскакивает, вызывается событие по оси `'X'`.
3. **Ось Z**: Рассчитывается `nextPosZ = pos.z + velocity.z * dt`. При пересечении скорость гасится или отскакивает, вызывается событие по оси `'Z'`.
4. **Трение**: Если `isGrounded === true` и `friction > 0`, к компонентам скорости `velocity.x` и `velocity.z` применяется затухание `velocity *= Math.pow(1 - friction, dt * 60)`. При падении модуля скорости ниже 0.05 м/с значение принудительно обнуляется.

---

### 4.2 Компонент `RigidBody`

Расположение: `lumina/physics/RigidBody.js`.
Назначение: Привязка физических характеристик к `GameObject` и синхронизация с его пространственным положением `transform.position`.

#### Конструктор
`constructor(gameObject: GameObject, options: Object = {})`

#### Параметры конфигурации (`options`)
| Параметр | Тип | По умолчанию | Описание |
| :--- | :--- | :--- | :--- |
| `bodyType` | `String` | `'dynamic'` | Режим тела: `'dynamic'` (подвержено силам, гравитации и перемещению) либо `'static'` (неподвижное препятствие). |
| `useGravity` | `Boolean` | `true` | Флаг применения гравитации к телу. |
| `friction` | `Number` | `0` | Коэффициент поверхностного трения в диапазоне от `0` (лед, отсутствие сопротивления) до `1` (мгновенное торможение). |
| `restitution` | `Number` | `0` | Коэффициент упругости при отскоке от `0` (абсолютно неупругий удар) до `1` (сохранение импульса). |

#### Свойства экземпляра
| Свойство | Тип | Описание |
| :--- | :--- | :--- |
| `velocity` | `THREE.Vector3` | Текущий вектор линейной скорости объекта (м/с). |
| `isGrounded` | `Boolean` | Флаг наличия контакта с поверхностью снизу. |
| `collider` | `Collider \| undefined` | Ссылка на коллайдер текущего `GameObject` (разрешается автоматически в `start()`). |
| `position` | `THREE.Vector3` | Прямая ссылка на `gameObject.transform.position`. |

#### Обработка событий коллизий
При столкновении физический движок вызывает `body.handleCollisions(others, axis)`. Метод транслирует событие во все компоненты текущего `GameObject`, у которых объявлен метод `onCollision(otherBody, axis)`:
```javascript
class HazardComponent extends Component {
    onCollision(otherBody, axis) {
        console.log(`Столкновение с объектом ${otherBody.gameObject.name} по оси ${axis}`);
    }
}
```

---

### 4.3 Коллайдеры (`Colliders.js`)

Расположение: `lumina/physics/Colliders.js`.

#### Базовый класс `Collider`
Наследуется от `Component`. Служит маркером наличия коллизионной формы у сущности.

#### Класс `BoxCollider`
Ориентированный по осям параллелепипед (AABB).
* Конструктор: `constructor(gameObject: GameObject, size: THREE.Vector3)`
  * `size` — трехмерный вектор габаритов (ширина, высота, глубина).
* Метод `getBox(position: THREE.Vector3): THREE.Box3`:
  * Возвращает экземпляр `THREE.Box3`, центрированный относительно точки `position` с учетом половины габаритов `halfSize`.

#### Класс `HeightfieldCollider`
Коллайдер карты высот на основе полигональной сетки `THREE.PlaneGeometry`.
* Конструктор: `constructor(gameObject, geometry, segmentsX, segmentsZ)`
* Метод `getHeightAt(worldX, worldZ): Number`:
  * Выполняет билинейную интерполяцию высот между четырьмя соседними вершинами сетки по мировым координатам X и Z. Возвращает мировую высоту Y или `-Infinity`, если точка лежит за пределами плоскости.

---

## 5. Полный рабочий пример

Ниже представлен пример создания сцены с управляемым объектом и физическим препятствием:

```javascript
import * as THREE from 'three';
import { Engine, GameObject, Component, BoxCollider, RigidBody } from './lumina/index.js';

// 1. Инициализация
const engine = new Engine('gameCanvas');

// 2. Освещение
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(10, 20, 15);
light.castShadow = true;
engine.renderer.scene.add(light);
engine.renderer.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// 3. Создание неподвижного пола
const floor = new GameObject('Floor');
const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(30, 1, 30),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floorMesh.receiveShadow = true;
floor.transform.add(floorMesh);
floor.transform.position.set(0, -0.5, 0);
floor.addComponent(BoxCollider, new THREE.Vector3(30, 1, 30));
floor.addComponent(RigidBody, { bodyType: 'static' });
engine.addGameObject(floor);

// 4. Компонент контроллера движения
class PlayerMovement extends Component {
    constructor(gameObject, speed = 6.0) {
        super(gameObject);
        this.speed = speed;
        this.body = null;
    }

    start() {
        this.body = this.gameObject.getComponent(RigidBody);
    }

    update(deltaTime) {
        if (!this.body) return;
        const input = this.engine.inputManager;
        
        let moveZ = 0;
        let moveX = 0;
        if (input.isKeyDown('KeyW')) moveZ -= 1;
        if (input.isKeyDown('KeyS')) moveZ += 1;
        if (input.isKeyDown('KeyA')) moveX -= 1;
        if (input.isKeyDown('KeyD')) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            this.body.velocity.x = (moveX / len) * this.speed;
            this.body.velocity.z = (moveZ / len) * this.speed;
        }

        if (input.isKeyDown('Space') && this.body.isGrounded) {
            this.body.velocity.y = 7.0;
            this.body.isGrounded = false;
        }
    }
}

// 5. Создание игрока
const player = new GameObject('Player');
const playerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
);
playerMesh.castShadow = true;
player.transform.add(playerMesh);
player.transform.position.set(0, 5, 0);
player.addComponent(BoxCollider, new THREE.Vector3(1, 2, 1));
player.addComponent(RigidBody, { bodyType: 'dynamic', friction: 0.1 });
player.addComponent(PlayerMovement, 7.0);
engine.addGameObject(player);

// 6. Настройка камеры и запуск
engine.renderer.camera.position.set(0, 10, 15);
engine.renderer.camera.lookAt(0, 0, 0);
engine.start();
```