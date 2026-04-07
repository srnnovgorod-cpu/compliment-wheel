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
const segmentAngle = (2 * Math.PI) / compliments.length;

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
    const resultIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    lastResultIndex = resultIndex;
    
    // Рассчитываем угол остановки
    const segmentDegrees = 360 / compliments.length;
    const targetSegmentAngle = resultIndex * segmentDegrees;
    const randomOffset = (Math.random() - 0.5) * segmentDegrees * 0.8;
    const finalAngle = 360 * 5 + (360 - targetSegmentAngle) + randomOffset;
    
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
            setTimeout(() => {
                showResult(compliments[resultIndex].text);
                isSpinning = false;
                spinBtn.disabled = false;
            }, 100);
        }
    }
    
    animate();
}

// === Показ результата с фейерверками ===
async function showResult(word) {
    wheelScreen.classList.remove('active');
    resultScreen.classList.add('active');
    resultWord.textContent = word.toUpperCase();
    
    await startFireworks();
}

// === Фейерверки ===
async function startFireworks() {
    const colors = ['#ff0000', '#00ff00', '#ff8c00'];
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            if (window.tsParticles && tsParticles.confetti) {
                tsParticles.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: {
                        x: Math.random() * 0.8 + 0.1,
                        y: Math.random() * 0.6 + 0.2
                    },
                    colors: colors
                });
            }
        }, i * 400);
    }
    
    const fireworkInterval = setInterval(() => {
        if (window.tsParticles && tsParticles.confetti) {
            tsParticles.confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: Math.random(),
                    y: Math.random() * 0.5
                },
                colors: colors
            });
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(fireworkInterval);
    }, 3000);
}

// === Продолжить ===
function continueApp() {
    resultScreen.classList.remove('active');
    wheelScreen.classList.add('active');
    document.getElementById('fireworks-container').innerHTML = '';
}

// === Обработчики событий ===
spinBtn.addEventListener('click', spinWheel);
continueBtn.addEventListener('click', continueApp);

// === Инициализация ===
drawWheel();

console.log('✅ Приложение готово!');
