// Настройка рендера
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Улучшение качества для высоких DPI
document.body.appendChild(renderer.domElement);

// Настройка тонового отображения
renderer.toneMapping = THREE.NoToneMapping; // Отключаем тоновое отображение
renderer.toneMappingExposure = 0.8;

// Настройка материала куба
const material = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 0.5, // Уменьшаем металличность
    roughness: 0.4, // Увеличиваем шероховатость
});

// Настройка освещения
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Уменьшаем интенсивность света
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

const bottomLeftLight = new THREE.DirectionalLight(0xffffff, 1); // Уменьшаем интенсивность второго источника света
bottomLeftLight.position.set(-10, -10, 5);
scene.add(bottomLeftLight);

// Настройка EffectComposer
const composer = new EffectComposer(renderer);
composer.setPixelRatio(window.devicePixelRatio); // Улучшение качества для высоких DPI
composer.setSize(window.innerWidth, window.innerHeight);

// Настройка BloomPass
const bloomPass = new BloomPass(
    2, // Уменьшаем силу эффекта
    25,  // Размер ядра свечения
    4,   // Размытие
    256  // Разрешение для рендера
);
composer.addPass(bloomPass);

// Настройка FilmPass
const filmPass = new FilmPass(
    0.1,  // Уменьшаем интенсивность шума
    0.01, // Уменьшаем интенсивность линий сканирования
    648,  // Количество линий сканирования
    false // Черно-белый режим
);
filmPass.renderToScreen = true;
composer.addPass(filmPass);