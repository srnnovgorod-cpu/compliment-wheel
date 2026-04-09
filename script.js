// === Инициализация Telegram Web App (с защитой) ===
let tg = null;

if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} else {
    console.log('Telegram Web App не доступен (запуск в браузере)');
}

// === Данные колеса ===
const compliments = [
    { text: 'прекрасная', color: '#FF6B9D' },
    { text: 'умная', color: '#4A90E2' },
    { text: 'веселая', color: '#FFD93D' },
    { text: 'обаятельная', color: '#9B59B6' },
    { text: 'милая', color: '#2ECC71' },
    { text: 'нежная', color: '#E67E22' },
    { text: 'добрая', color: '#E74C3C' },
    { text: 'заботливая', color: '#1ABC9C' }
];

const segmentCount = compliments.length;
const segmentDegrees = 360 / segmentCount;

let lastResultIndex = -1;
let currentRotation = 0;
let isSpinning = false;

// === Элементы DOM ===
const wheelScreen = document.getElementById('wheel-screen');
const resultScreen = document.getElementById('result-screen');
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const continueBtn = document.getElementById('continue-btn');
const resultWord = document.getElementById('result-word');

// === Настройка Canvas ===
const ctx = wheel.getContext('2d');
const centerX = wheel.width / 2;
const centerY = wheel.height / 2;
const radius = wheel.width / 2 - 10;
const segmentAngle = (2 * Math.PI) / segmentCount;

// === Отрисовка колеса ===
function drawWheel() {
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    
    compliments.forEach((compliment, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        
        // Рисуем сегмент
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = compliment.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Рисуем текст
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(compliment.text, radius - 20, 5);
        ctx.restore();
    });
    
    // Центральный круг
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// === Вычисление результата по углу вращения ===
function calculateResult(finalRotation) {
    // Нормализуем угол (0-360)
    const normalizedRotation = finalRotation % 360;
    
    // Стрелка сверху (0 градусов), колесо крутится по часовой
    // Поэтому вычисляем какой сегмент оказался наверху
    const effectiveAngle = (360 - normalizedRotation) % 360;
    
    // Вычисляем индекс сегмента
    const resultIndex = Math.floor(effectiveAngle / segmentDegrees);
    
    return resultIndex % segmentCount;
}

// === Вращение колеса ===
function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    
    // Вибрация (если Telegram доступен)
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    
    // Выбираем случайный сегмент (не повторяющийся)
    let availableIndices = compliments.map((_, i) => i).filter(i => i !== lastResultIndex);
    const targetIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // Рассчитываем угол для попадания на нужный сегмент
    // Сегмент 0 начинается с 0 градусов, сегмент 1 с 45 градусов и т.д.
    // Чтобы сегмент оказался под стрелкой (сверху), нужно повернуть колесо так,
    // чтобы центр сегмента был на 0 градусов
    const segmentCenterAngle = targetIndex * segmentDegrees + segmentDegrees / 2;
    
    // Минимум 5 полных оборотов + угол для нужного сегмента
    const minSpins = 5;
    const baseRotation = 360 * minSpins;
    
    // Добавляем небольшую случайность внутри сегмента (±40% от ширины сегмента)
    const randomOffset = (Math.random() - 0.5) * segmentDegrees * 0.8;
    
    // Финальный угол вращения
    const finalAngle = baseRotation + (360 - segmentCenterAngle) + randomOffset;
    
    // Анимация вращения (3 секунды с замедлением)
    const duration = 3000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + finalAngle * easeProgress;
        
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        wheel.style.transition = 'none';
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Анимация завершена - вычисляем реальный результат
            setTimeout(() => {
                const resultIndex = calculateResult(currentRotation);
                lastResultIndex = resultIndex;
                showResult(compliments[resultIndex].text);
                isSpinning = false;
                spinBtn.disabled = false;
            }, 100);
        }
    }
    
    animate();
}

// === Показ результата с фейерверками ===
function showResult(word) {
    wheelScreen.classList.remove('active');
    resultScreen.classList.add('active');
    resultWord.textContent = word.toUpperCase();
    
    // Запускаем фейерверки
    startFireworks();
}

// === Фейерверки (canvas-confetti) ===
function startFireworks() {
    const colors = ['#ff0000', '#00ff00', '#ff8c00', '#ffff00', '#ff00ff', '#00ffff'];
    
    // Несколько залпов
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: {
                    x: Math.random() * 0.8 + 0.1,
                    y: Math.random() * 0.6 + 0.2
                },
                colors: colors,
                gravity: 1.2,
                drift: 0,
                ticks: 200
            });
        }, i * 300);
    }
    
    // Дополнительные залпы в течение 3 секунд
    const fireworkInterval = setInterval(() => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: {
                x: Math.random(),
                y: Math.random() * 0.5
            },
            colors: colors,
            gravity: 1.2,
            ticks: 150
        });
    }, 400);
    
    // Останавливаем через 3 секунды
    setTimeout(() => {
        clearInterval(fireworkInterval);
    }, 3000);
}

// === Продолжить ===
function continueApp() {
    resultScreen.classList.remove('active');
    wheelScreen.classList.add('active');
}

// === Обработчики событий ===
spinBtn.addEventListener('click', spinWheel);
continueBtn.addEventListener('click', continueApp);

// === Инициализация ===
drawWheel();

console.log('✅ Приложение готово!');
console.log('🎡 Сегментов:', segmentCount);
console.log('📐 Градусов на сегмент:', segmentDegrees);
