
// 1. Создаем сцену
const scene = new THREE.Scene();

// 2. Создаем камеру
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

// Устанавливаем положение камеры
camera.position.set(0, 0, 185); // Увеличиваем Z, чтобы отдалить объект

// 3. Создаем рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Создаем RGBELoader и загружаем HDR-текстуру
const loader = new RGBELoader();
loader.load('/public/enviroment.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; // Устанавливаем HDR как окружение
    scene.background = texture;  // Устанавливаем HDR как фон
});

// 5. Создаем геометрию куба и материал
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 0.7,
    roughness: 0.1,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 6. Добавляем освещение (опционально)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Устанавливаем начальное положение камеры
camera.position.z = 5;
camera.position.y = 0; // Начальная позиция камеры по оси Y

// Переменные для плавного скролла и инерции
let targetScrollY = 0; // Целевое значение прокрутки
let currentScrollY = 0; // Текущее значение прокрутки
let scrollVelocity = 0; // Скорость прокрутки для инерции
const lerpFactor = 0.05; // Коэффициент плавности (0.1 = 10% за шаг)
const inertiaDeceleration = 0.50; // Коэффициент замедления инерции (0.95 = 5% замедления за шаг)

// Переменные для движения куба за курсором
let targetCubePosition = new THREE.Vector3(0, 0, 0); // Целевая позиция куба (курсор)
let cubeVelocity = new THREE.Vector3(0, 0, 0); // Скорость куба
const cubeLerpFactor = 0.1; // Коэффициент плавности движения куба
const cubeInertiaDeceleration = 0.95; // Коэффициент замедления инерции куба

// Обработчик события прокрутки колеса мыши
window.addEventListener('wheel', (event) => {
    // Обновляем скорость прокрутки
    scrollVelocity += event.deltaY * 0.0007; // Масштабируем значение для плавности
});

// Обработчик события движения мыши
window.addEventListener('mousemove', (event) => {
    // Нормализуем координаты мыши от -1 до 1
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Создаем луч (Ray) из камеры в направлении курсора
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouseVector, camera);

    // Вычисляем точку пересечения луча с плоскостью Z = 0
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Устанавливаем целевую позицию куба
    targetCubePosition.copy(intersection);
});

// 7. Функция анимации
function animate() {
    requestAnimationFrame(animate);

    // Применяем инерцию для прокрутки
    if (Math.abs(scrollVelocity) > 0.01) { // Если скорость достаточно большая
        targetScrollY += scrollVelocity; // Обновляем целевое значение прокрутки
        scrollVelocity *= inertiaDeceleration; // Замедляем скорость
    } else {
        scrollVelocity = 0; // Останавливаем инерцию, если скорость слишком мала
    }

    // Ограничиваем значение прокрутки, чтобы камера не уходила слишком далеко
    targetScrollY = Math.max(-3, Math.min(3, targetScrollY));

    // Плавно интерполируем текущее значение прокрутки к целевому
    currentScrollY = THREE.MathUtils.lerp(currentScrollY, targetScrollY, lerpFactor);

    // Обновляем положение камеры по оси Y
    camera.position.y = -currentScrollY; // Инвертируем значение для интуитивного скролла

    // Вычисляем разницу между текущей позицией куба и целевой позицией
    const deltaX = targetCubePosition.x - cube.position.x;
    const deltaY = targetCubePosition.y - cube.position.y;

    // Обновляем скорость куба на основе разницы
    cubeVelocity.x += deltaX * cubeLerpFactor * 0.1;
    cubeVelocity.y += deltaY * cubeLerpFactor * 0.1;

    // Применяем инерцию для куба
    cubeVelocity.multiplyScalar(cubeInertiaDeceleration); // Замедляем скорость куба
    cube.position.add(cubeVelocity); // Обновляем позицию куба

    // Вращаем куб для наглядности (опционально)
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Рендерим сцену с обновленной камерой
    renderer.render(scene, camera);
}

// Запускаем анимацию
animate();

// 8. Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});