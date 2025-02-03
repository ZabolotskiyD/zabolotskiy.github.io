import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BloomPass } from "three/addons/postprocessing/BloomPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";

// 1. Создаем сцену
const scene = new THREE.Scene();

// 2. Создаем камеру
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50); // Приближаем камеру

// 3. Создаем рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Настройка экспозиции (яркости) фона
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 4. Создаем RGBELoader и загружаем HDR-текстуру
const loader = new RGBELoader();
loader.load('https://rawcdn.githack.com/ZabolotskiyD/zabolotskiyd.github.io/1700c409e6d8e04dd2db9938172170bf1924dc38/public/dark-light-studio.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
});

// 5. Создаем геометрию куба и материал
const geometry = new THREE.BoxGeometry(10, 10, 10); // Увеличиваем размер куба
const material = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 0.7,
    roughness: 0.3,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 6. Добавляем освещение
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Уменьшаем интенсивность света
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

const bottomLeftLight = new THREE.DirectionalLight(0xffffff, 1.0); // Уменьшаем интенсивность второго источника света
bottomLeftLight.position.set(-10, -10, 5);
scene.add(bottomLeftLight);

// 7. Создаем EffectComposer и добавляем эффекты
const composer = new EffectComposer(renderer);

// Добавляем базовый RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Эффект Bloom
const bloomPass = new BloomPass(
    1.5, // strength (сила эффекта)
    25,  // kernel size (размер ядра свечения)
    2,   // sigma (размытие)
    256  // разрешение для рендера
);
composer.addPass(bloomPass);

// Эффект FilmPass (эффект пленки, например, зернистость)
const filmPass = new FilmPass(
    0.35, // noise intensity (интенсивность шума)
    0.025, // scanline intensity (интенсивность линий сканирования)
    648,   // scanline count (количество линий сканирования)
    false  // grayscale (черно-белый режим)
);
filmPass.renderToScreen = true; // Этот эффект будет последним в цепочке
composer.addPass(filmPass);

// 8. Переменные для плавного скролла и инерции
let targetScrollY = 0;
let currentScrollY = 0;
let scrollVelocity = 0;
const lerpFactor = 0.05;
const inertiaDeceleration = 0.50;

// 9. Переменные для движения куба за курсором
let targetCubePosition = new THREE.Vector3(0, 0, 0);
let cubeVelocity = new THREE.Vector3(0, 0, 0);
const cubeLerpFactor = 0.1;
const cubeInertiaDeceleration = 0.95;

// 10. Обработчики событий
window.addEventListener('wheel', (event) => {
    scrollVelocity += event.deltaY * 0.0007;
});

window.addEventListener('mousemove', (event) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouseVector, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    targetCubePosition.copy(intersection);
});

// 11. Функция анимации
function animate() {
    requestAnimationFrame(animate);

    // Прокрутка и инерция
    if (Math.abs(scrollVelocity) > 0.01) {
        targetScrollY += scrollVelocity;
        scrollVelocity *= inertiaDeceleration;
    } else {
        scrollVelocity = 0;
    }
    targetScrollY = Math.max(-3, Math.min(3, targetScrollY));
    currentScrollY = THREE.MathUtils.lerp(currentScrollY, targetScrollY, lerpFactor);
    camera.position.y = -currentScrollY;

    // Движение куба
    const deltaX = targetCubePosition.x - cube.position.x;
    const deltaY = targetCubePosition.y - cube.position.y;
    cubeVelocity.x += deltaX * cubeLerpFactor * 0.1;
    cubeVelocity.y += deltaY * cubeLerpFactor * 0.1;
    cubeVelocity.multiplyScalar(cubeInertiaDeceleration);
    cube.position.add(cubeVelocity);

    // Вращение куба
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Рендеринг через EffectComposer
    composer.render();
}

// Запуск анимации
animate();

// 12. Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});