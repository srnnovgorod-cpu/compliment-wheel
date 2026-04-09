// === Инициализация Telegram Web App ===
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
const segmentDegrees = 360 / segmentCount; // 45 градусов на сегмент

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
        // Canvas: 0 градусов = 3 часа, вращение по часовой
        const startAngle = index * segmentAngle - Math.PI / 2; // -90° чтобы 0-й сегмент был сверху
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
    
    // Стрелка сверху. Колесо крутится по часовой.
    // Значит сегмент под стрелкой = (360 - normalizedRotation) / segmentDegrees
    const index = Math.floor((360 - normalizedRotation) / segmentDegrees) % segmentCount;
    
    return index;
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
    
    console.log('🎯 Целевой индекс:', targetIndex, '(', compliments[targetIndex].text, ')');
    
    // Рассчитываем угол для попадания на нужный сегмент
    // Каждый сегмент = 45 градусов
    // Чтобы сегмент N оказался сверху, нужно повернуть на: 360 - (N * 45 + 22.5)
    const segmentCenterAngle = targetIndex * segmentDegrees + segmentDegrees / 2;
    
    // Минимум 5 полных оборотов
    const minSpins = 5;
    const baseRotation = 360 * minSpins;
    
    // Добавляем небольшую случайность внутри сегмента (±40% от ширины сегмента)
    const randomOffset = (Math.random() - 0.5) * segmentDegrees * 0.8;
    
    // Финальный угол вращения
    const finalAngle = baseRotation + (360 - segmentCenterAngle) + randomOffset;
    
    console.log('📐 Финальный угол:', finalAngle.toFixed(2), 'градусов');
    
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
                
                console.log('🏁 Остановились на угле:', currentRotation.toFixed(2));
                console.log('🏁 Нормализованный угол:', (currentRotation % 360).toFixed(2));
                console.log('🏁 Вычисленный индекс:', resultIndex, '(', compliments[resultIndex].text, ')');
                console.log('🏁 Целевой индекс:', targetIndex, '
