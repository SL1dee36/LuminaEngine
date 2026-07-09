// main.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

import Engine from './core/Engine.js';
import GameObject from './core/GameObject.js';

// 1. Инициализация движка
// Для начала работы необходимо создать экземпляр класса Engine, передав ему ID HTML-элемента canvas[cite: 167].
const engine = new Engine('gameCanvas');

// 2. Создание игровых объектов и компонентов
// Вся логика строится вокруг экземпляров GameObject, а поведение определяется компонентами[cite: 168].
// Пример того, как разработчик будет добавлять свои объекты:

/*
const myObject = new GameObject('Player');
myObject.addComponent(new MyCustomComponent());
engine.addGameObject(myObject);
*/

// 3. Запуск игрового цикла
// После настройки всех объектов, запускаем главный цикл[cite: 171].
engine.start();