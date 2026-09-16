// Data State Setup
let tasks = JSON.parse(localStorage.getItem('omnitrack_tasks')) || [];
let activeFilter = 'Central';
let activeDate = new Date();

// DOM Elements
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const dateDisplay = document.getElementById('current-date-display');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    renderTasks();
    setupFilters();
    setupStatusListener();
});

// --- DATE NAVIGATION ---
function changeDate(days) {
    activeDate.setDate(activeDate.getDate() + days);
    updateDateDisplay();
    renderTasks();
}

function updateDateDisplay() {
    const today = new Date();
    const isToday = activeDate.toDateString() === today.toDateString();
    
    if (isToday) {
        dateDisplay.innerText = "Today";
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateDisplay.innerText = activeDate.toLocaleDateString(undefined, options);
    }
}

// --- TAB SWITCHING (Calendar / Analytics) ---
function switchTab(tab) {
    document.getElementById('nav-calendar').classList.remove('bg-gray-700', 'text-white');
    document.getElementById('nav-analytics').classList.remove('bg-gray-700', 'text-white');
    
    document.getElementById(`nav-${tab}`).classList.add('bg-gray-700', 'text-white');
    
    if (tab === 'calendar') {
        document.getElementById('view-calendar').classList.remove('hidden');
        document.getElementById('view-analytics').classList.add('hidden');
        document.getElementById('calendar-filters').style.display = 'flex';
        document.getElementById('date-controls').style.display = 'flex';
        renderTasks();
    } else {
        document.getElementById('view-calendar').classList.add('hidden');
        document.getElementById('view-analytics').classList.remove('hidden');
        document.getElementById('calendar-filters').style.display = 'none';
        document.getElementById('date-controls').style.display = 'none';
        renderAnalytics();
    }
}

// --- FILTERING ---
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active classes
            buttons.forEach(b => {
                b.classList.remove('bg-gray-700', 'text-white', 'border-gray-600', 'active');
                b.classList.add('text-gray-400', 'border-transparent');
            });
            // Add active class to clicked
            e.target.classList.remove('text-gray-400', 'border-transparent');
            e.target.classList.add('bg-gray-700', 'text-white', 'border-gray-600', 'active');
            
            activeFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });
}

// --- RENDERING TASKS ---
function renderTasks() {
    taskList.innerHTML = '';
    
    // Filter tasks by active date and active category filter
    let filteredTasks = tasks.filter(t => t.date === formatDateForInput(activeDate));
    
    if (activeFilter !== 'Central') {
        filteredTasks = filteredTasks.filter(t => t.category === activeFilter);
    }
    
    // Sort chronologically
    filteredTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        
        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:border-gray-500 transition-colors border-l-4 cat-border-${task.category.toLowerCase()}`;
            
            // Format Times
            const timeStr = `${formatAmPm(task.startTime)} - ${formatAmPm(task.endTime)}`;
            
            // Reflection UI (if delayed/abandoned)
            let reflectionHtml = '';
            if ((task.status === 'Delayed' || task.status === 'Abandoned') && task.reflection) {
                reflectionHtml = `<div class="mt-2 text-sm text-gray-400 bg-gray-900 p-2 rounded border border-gray-700"><i>Reflection:</i> ${task.reflection}</div>`;
            }

            card.innerHTML = `
                <div class="flex-1 cursor-pointer" onclick="editTask('${task.id}')">
                    <div class="flex items-center space-x-3 mb-1">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full cat-tag-${task.category.toLowerCase()}">${task.category}</span>
                        <span class="text-sm font-medium status-${task.status.split(' ')[0]}">• ${task.status}</span>
                    </div>
                    <h4 class="text-lg font-bold text-white mb-1">${task.title}</h4>
                    <p class="text-sm text-gray-400 flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${timeStr}
                    </p>
                    ${reflectionHtml}
                </div>
                <div class="mt-4 md:mt-0 flex items-center space-x-2">
                    <select onchange="quickUpdateStatus('${task.id}', this.value)" class="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="Pending" ${task.status==='Pending'?'selected':''}>Pending</option>
                        <option value="Completed" ${task.status==='Completed'?'selected':''}>Completed</option>
                        <option value="Partially Completed" ${task.status==='Partially Completed'?'selected':''}>Partially Completed</option>
                        <option value="Delayed" ${task.status==='Delayed'?'selected':''}>Delayed</option>
                        <option value="Abandoned" ${task.status==='Abandoned'?'selected':''}>Abandoned</option>
                    </select>
                    <button onclick="deleteTask('${task.id}')" class="p-2 text-gray-500 hover:text-red-400 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            taskList.appendChild(card);
        });
    }
}

// --- TASK MODAL LOGIC ---
function openModal() {
    document.getElementById('modal-title').innerText = 'Add New Task';
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-date').value = formatDateForInput(activeDate);
    document.getElementById('status-container').classList.add('hidden');
    document.getElementById('reflection-container').classList.add('hidden');
    
    taskModal.classList.remove('hidden');
}

function closeModal() {
    taskModal.classList.add('hidden');
}

function setupStatusListener() {
    document.getElementById('task-status').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'Delayed' || val === 'Abandoned') {
            document.getElementById('reflection-container').classList.remove('hidden');
        } else {
            document.getElementById('reflection-container').classList.add('hidden');
        }
    });
}

// CRUD Operations
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id').value;
    const isNew = !id;
    
    const taskObj = {
        id: isNew ? Date.now().toString() : id,
        title: document.getElementById('task-title').value,
        date: document.getElementById('task-date').value,
        category: document.getElementById('task-category').value,
        startTime: document.getElementById('task-start').value,
        endTime: document.getElementById('task-end').value,
        status: isNew ? 'Pending' : document.getElementById('task-status').value,
        reflection: document.getElementById('task-reflection').value
    };

    if (isNew) {
        tasks.push(taskObj);
    } else {
        const index = tasks.findIndex(t => t.id === id);
        tasks[index] = taskObj;
    }

    saveData();
    closeModal();
    renderTasks();
});

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if(!task) return;

    document.getElementById('modal-title').innerText = 'Edit Task Reflection & Details';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-start').value = task.startTime;
    document.getElementById('task-end').value = task.endTime;
    
    // Status Logic
    document.getElementById('status-container').classList.remove('hidden');
    document.getElementById('task-status').value = task.status;
    
    if (task.status === 'Delayed' || task.status === 'Abandoned') {
        document.getElementById('reflection-container').classList.remove('hidden');
        document.getElementById('task-reflection').value = task.reflection || '';
    } else {
        document.getElementById('reflection-container').classList.add('hidden');
        document.getElementById('task-reflection').value = '';
    }

    taskModal.classList.remove('hidden');
}

function quickUpdateStatus(id, newStatus) {
    const index = tasks.findIndex(t => t.id === id);
    if(index > -1) {
        tasks[index].status = newStatus;
        if(newStatus === 'Delayed' || newStatus === 'Abandoned') {
            // Force open modal to enter reflection
            editTask(id); 
        } else {
            tasks[index].reflection = '';
            saveData();
            renderTasks();
        }
    }
}

function deleteTask(id) {
    if(confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderTasks();
    }
}

function saveData() {
    localStorage.setItem('omnitrack_tasks', JSON.stringify(tasks));
}

// --- ANALYTICS DASHBOARD ---
function renderAnalytics() {
    const totalTasks = tasks.length;
    document.getElementById('stat-total').innerText = totalTasks;

    if(totalTasks === 0) return;

    // 1. Efficiency (% Completed)
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const efficiency = Math.round((completedTasks / totalTasks) * 100);
    document.getElementById('stat-efficiency').innerText = `${efficiency}%`;

    // 2. Delay Insights
    const delayCounts = { JEE: 0, Societies: 0, College: 0, Personal: 0 };
    tasks.forEach(t => {
        if(t.status === 'Delayed' || t.status === 'Abandoned') {
            delayCounts[t.category]++;
        }
    });
    
    let maxDelayCat = 'None';
    let maxDelayVal = 0;
    for (const [cat, count] of Object.entries(delayCounts)) {
        if (count > maxDelayVal) {
            maxDelayVal = count;
            maxDelayCat = cat;
        }
    }
    document.getElementById('stat-delayed').innerText = maxDelayCat;

    // 3. Time Allocation (Hours Spent)
    const timeSpent = { JEE: 0, Societies: 0, College: 0, Personal: 0 };
    let maxTime = 0;

    tasks.forEach(t => {
        const start = new Date(`1970-01-01T${t.startTime}:00Z`);
        const end = new Date(`1970-01-01T${t.endTime}:00Z`);
        let diffHours = (end - start) / (1000 * 60 * 60);
        if (diffHours < 0) diffHours += 24; // Handle over-midnight
        
        timeSpent[t.category] += diffHours;
    });

    for (const cat in timeSpent) {
        if (timeSpent[cat] > maxTime) maxTime = timeSpent[cat];
    }

    const barsContainer = document.getElementById('time-allocation-bars');
    barsContainer.innerHTML = '';
    
    const colors = {
        JEE: 'bg-blue-500',
        Societies: 'bg-purple-500',
        College: 'bg-green-500',
        Personal: 'bg-orange-500'
    };

    for (const [cat, hours] of Object.entries(timeSpent)) {
        const percentage = maxTime === 0 ? 0 : Math.round((hours / maxTime) * 100);
        const displayHours = hours.toFixed(1);
        
        barsContainer.innerHTML += `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-white">${cat}</span>
                    <span class="text-gray-400">${displayHours} hrs</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2.5">
                    <div class="${colors[cat]} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }
}

// --- UTILS ---
function formatDateForInput(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatAmPm(timeStr) {
    let [hours, minutes] = timeStr.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}
