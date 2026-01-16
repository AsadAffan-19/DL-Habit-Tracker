// script.js - Beginner-friendly JS with comments

// Replace with your Google Client ID from https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // Get this from Google Console

let user = null;
let habits = JSON.parse(localStorage.getItem('habits')) || []; // Load habits from localStorage
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

// Initialize Google Sign-In
function initGoogleSignIn() {
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
    });
}

// Handle Google Sign-In
function handleGoogleSignIn(response) {
    // Decode JWT token to get user info (simple way for demo)
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    user = payload;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-name').textContent = `Hi, ${user.name}!`;
    loadHabits();
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    user = null;
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    localStorage.clear(); // Clear data on logout
});

// Add new habit
document.getElementById('add-habit').addEventListener('click', () => {
    const name = document.getElementById('new-habit').value.trim();
    if (name) {
        habits.push({
            name,
            days: Array(daysInMonth).fill(false) // Grey boxes initially unchecked
        });
        document.getElementById('new-habit').value = '';
        saveHabits();
        renderHabits();
        updateGraphs();
    }
});

// Load and render habits grid
function loadHabits() {
    renderHabits();
    updateGraphs();
}

function renderHabits() {
    const grid = document.getElementById('habits-grid');
    grid.innerHTML = '';
    habits.forEach((habit, habitIndex) => {
        // Habit name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'habit-name';
        nameDiv.textContent = habit.name;
        grid.appendChild(nameDiv);

        // Day boxes
        const row = document.createElement('div');
        row.className = 'habit-row';
        for (let day = 0; day < daysInMonth; day++) {
            const box = document.createElement('div');
            box.className = 'day-box';
            if (habit.days[day]) box.classList.add('checked');
            box.addEventListener('click', () => toggleHabit(habitIndex, day));
            row.appendChild(box);
        }
        grid.appendChild(row);
    });
}

// Toggle habit day
function toggleHabit(habitIndex, dayIndex) {
    habits[habitIndex].days[dayIndex] = !habits[habitIndex].days[dayIndex];
    saveHabits();
    renderHabits();
    updateGraphs();
}

// Save to localStorage
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Update graphs
function updateGraphs() {
    updateDailyGraph();
    updateMonthlyCircle();
    updateTopHabits();
}

// Daily Progress Graph (simplified line chart for today)
function updateDailyGraph() {
    const today = new Date().getDate() - 1; // 0-based
    const canvas = document.getElementById('daily-graph');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Example daily percentages (you can compute real daily history)
    const dailyPercents = [];
    for (let d = 0; d < daysInMonth; d++) {
        let completed = 0;
        habits.forEach(habit => {
            if (habit.days[d]) completed++;
        });
        dailyPercents.push((completed / habits.length) * 100 || 0);
    }

    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - dailyPercents[0]);
    for (let i = 1; i < dailyPercents.length; i++) {
        ctx.lineTo((i / dailyPercents.length) * canvas.width, canvas.height - dailyPercents[i]);
    }
    ctx.stroke();

    // Highlight today
    ctx.fillStyle = '#4caf50';
    ctx.fillRect((today / daysInMonth) * canvas.width - 2, canvas.height - dailyPercents[today] - 2, 4, 4);
}

// Monthly Circle (pie chart)
function updateMonthlyCircle() {
    let totalDays = 0;
    let completedDays = 0;
    habits.forEach(habit => {
        const completed = habit.days.filter(Boolean).length;
        totalDays += habit.days.length;
        completedDays += completed;
    });
    const percent = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;
    document.getElementById('monthly-percent').textContent = percent + '%';

    const canvas = document.getElementById('monthly-circle');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 40;

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#444';
    ctx.fill();

    // Progress arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, (percent / 100) * 2 * Math.PI - Math.PI / 2);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#4caf50';
    ctx.stroke();
}

// Top Habits (top 3 by completion %)
function updateTopHabits() {
    const topHabits = habits
        .map((h, i) => ({
            ...h,
            index: i,
            percent: h.days.filter(Boolean).length / h.days.length * 100
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

    const list = document.getElementById('top-habits-list');
    list.innerHTML = '';
    topHabits.forEach(habit => {
        const li = document.createElement('li');
        li.textContent = `${habit.name}: ${Math.round(habit.percent)}%`;
        list.appendChild(li);
    });
}

// Monthly Wrapped Popup
document.getElementById('monthly-wrapped').addEventListener('click', () => {
    const popup = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    let totalCompleted = 0;
    let totalDays = 0;
    habits.forEach(habit => {
        const completed = habit.days.filter(Boolean).length;
        totalCompleted += completed;
        totalDays += habit.days.length;
    });
    content.innerHTML = `
        <h3>Your Monthly Update</h3>
        <p>Habits: ${habits.length}</p>
        <p>Days tracked: ${daysInMonth}</p>
        <p>Tasks completed: ${totalCompleted} / ${totalDays}</p>
        <p>Overall: ${Math.round((totalCompleted / totalDays) * 100)}%</p>
        <ul>${habits.map(h => `<li>${h.name}: ${h.days.filter(Boolean).length}/${h.days.length}</li>`).join('')}</ul>
    `;
    popup.classList.remove('hidden');
});

// Close popup
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('popup').classList.add('hidden');
});

// Download PNG (capture popup as image)
document.getElementById('download-png').addEventListener('click', () => {
    const popup = document.getElementById('popup-content');
    html2canvas(popup).then(canvas => {
        const link = document.createElement('a');
        link.download = 'monthly-wrapped.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

// Load html2canvas for PNG (add to head: <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>)
document.head.insertAdjacentHTML('beforeend', '<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>');

// Init on load
window.addEventListener('load', () => {
    initGoogleSignIn();
});
