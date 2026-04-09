console.log('🔹 Script начал загрузку...');

// === Проверка элементов ===
const wheelScreen = document.getElementById('wheel-screen');
const resultScreen = document.getElementById('result-screen');
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const continueBtn = document.getElementById('continue-btn');
const resultWord = document.getElementById('result-word');

// === Telegram ===
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// === Данные ===
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
const segmentDegrees = 360 / segmentCount; // 45 градусов

let lastResultIndex = -1;
let currentRotation = 0;
let isSpinning = false;

// === Canvas ===
const ctx = wheel.getContext('2d');
const centerX = wheel.width / 2;
const centerY = wheel.height / 2;
const radius = wheel.width / 2 - 10;
const segmentAngle = (2 * Math.PI) / segmentCount;

// === Отрисовка колеса ===
function drawWheel() {
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    
    for (let i = 0; i < segmentCount; i++) {
        const startAngle = i * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        
        // Сегмент
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = compliments[i].color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Текст
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(compliments[i].text, radius - 20, 5);
        ctx.restore();
    }
    
    // Центр
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

// === Вычисление результата по углу ===
function getResultIndex(rotation) {
    const normalized = rotation % 360;
    // Стрелка на 270° (12 часов в Canvas)
    // После вращения на normalized°, сегмент на угле (270 - normalized) будет под стрелкой
    let angle = (270 - normalized + 360) % 360;
    const index = Math.floor(angle / segmentDegrees);
    return index % segmentCount;
}

// === Вращение ===
function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    
    // Выбираем индекс (не повторяющийся)
    let available = compliments.map((_, i) => i).filter(i => i !== lastResultIndex);
    const targetIndex = available[Math.floor(Math.random() * available.length)];
    
    console.log('🎯 Целевой индекс:', targetIndex, compliments[targetIndex].text);
    
    // Центр целевого сегмента в Canvas
    const segmentCenter = targetIndex * segmentDegrees + segmentDegrees / 2;
    
    // Чтобы сегмент оказался наверху (270°), нужно повернуть на:
    const rotationToTop = (270 - segmentCenter + 360) % 360;
    
    // 5 полных оборотов + угол для сегмента + небольшая случайность
    const spins = 360 * 5;
    const randomOffset = (Math.random() - 0.5) * segmentDegrees * 0.8;
    const finalAngle = spins + rotationToTop + randomOffset;
    
    console.log('📐 Центр сегмента:', segmentCenter.toFixed(2), '°');
    console.log('📐 Поворот для верха:', rotationToTop.toFixed(2), '°');
    console.log('📐 Финальный угол:', finalAngle.toFixed(2), '°');
    
    // Анимация
    const duration = 3000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + finalAngle * easeProgress;
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        wheel.style.transition = 'none';
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                const resultIndex = getResultIndex(currentRotation);
                
                console.log('🏁 Нормализованный угол:', (currentRotation % 360).toFixed(2), '°');
                console.log('🏁 Вычисленный индекс:', resultIndex, compliments[resultIndex].text);
                console.log('🎯 Целевой индекс:', targetIndex, compliments[targetIndex].text);
                console.log('✅ Совпадение:', resultIndex === targetIndex ? 'ДА' : 'НЕТ');
                
                lastResultIndex = resultIndex;
                showResult(compliments[resultIndex].text);
                isSpinning = false;
                spinBtn.disabled = false;
            }, 100);
        }
    }
    
    animate();
}

// === Результат ===
function showResult(word) {
    wheelScreen.classList.remove('active');
    resultScreen.classList.add('active');
    resultWord.textContent = word.toUpperCase();
    startFireworks();
}

// === Фейерверки ===
function startFireworks() {
    const colors = ['#ff0000', '#00ff00', '#ff8c00'];
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: Math.random() * 0.6 + 0.2 },
                colors: colors
            });
        }, i * 300);
    }
}

// === Продолжить ===
function continueApp() {
    resultScreen.classList.remove('active');
    wheelScreen.classList.add('active');
}

// === Обработчики ===
spinBtn.addEventListener('click', spinWheel);
continueBtn.addEventListener('click', continueApp);

// === Запуск ===
drawWheel();
console.log('✅ Приложение готово!');
