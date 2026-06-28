document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const statCompleted = document.getElementById('stat-completed');
    const statTotal = document.getElementById('stat-total');
    const currentDateEl = document.getElementById('current-date');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // --- Initialization ---
    init();

    function init() {
        updateDate();
        renderTasks();
        
        // Event Listeners
        addTaskBtn.addEventListener('click', handleAddTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddTask();
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
    }

    // --- Core Logic ---
    function handleAddTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        taskInput.value = '';
        saveAndRender();
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveAndRender();
    }

    function deleteTask(id) {
        // Add exit animation class before actual removal if we wanted, 
        // but for now immediate filter is fine.
        const li = document.querySelector(`[data-id="${id}"]`);
        if (li) {
            li.style.opacity = '0';
            li.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveAndRender();
            }, 200); // Wait for transition
        } else {
            tasks = tasks.filter(task => task.id !== id);
            saveAndRender();
        }
    }

    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if(!task) return;
        
        const newText = prompt("Edit task:", task.text);
        if(newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveAndRender();
        }
    }

    // --- Storage & Rendering ---
    function saveAndRender() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    function renderTasks() {
        // Filter tasks
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        // Sort: incomplete first, then by creation date (newest first)
        filteredTasks.sort((a, b) => {
            if (a.completed === b.completed) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return a.completed ? 1 : -1;
        });

        // Update DOM
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;
                
                // Formatted date
                const dateObj = new Date(task.createdAt);
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

                li.innerHTML = `
                    <button class="task-checkbox-btn" aria-label="Toggle Completion">
                        <i class='bx bx-check'></i>
                    </button>
                    <div class="task-content">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        <span class="task-date">Added on ${dateStr}</span>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit" aria-label="Edit Task" title="Edit">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="action-btn delete" aria-label="Delete Task" title="Delete">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                `;

                // Bind events directly
                const toggleBtn = li.querySelector('.task-checkbox-btn');
                toggleBtn.addEventListener('click', () => toggleTask(task.id));

                const editBtn = li.querySelector('.action-btn.edit');
                editBtn.addEventListener('click', () => editTask(task.id));

                const delBtn = li.querySelector('.action-btn.delete');
                delBtn.addEventListener('click', () => deleteTask(task.id));

                taskList.appendChild(li);
            });
        }

        updateStats();
    }

    function updateStats() {
        const completedCount = tasks.filter(t => t.completed).length;
        statCompleted.textContent = completedCount;
        statTotal.textContent = tasks.length;
    }

    function updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString(undefined, options);
    }

    // Utility to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
