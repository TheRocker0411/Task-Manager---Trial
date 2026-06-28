document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const taskInput = document.getElementById('task-input');
    const taskDueDate = document.getElementById('task-due-date');
    const addTaskBtn = document.getElementById('add-task-btn');
    
    const listView = document.getElementById('list-view');
    const calendarView = document.getElementById('calendar-view');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    const statCompleted = document.getElementById('stat-completed');
    const statTotal = document.getElementById('stat-total');
    const currentDateEl = document.getElementById('current-date');

    // Calendar Elements
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all'; // all, active, completed
    let currentView = 'list'; // list, calendar
    let currentDate = new Date(); // Used for calendar navigation
    let selectedCalendarDate = null; // Currently clicked day on calendar

    // --- Initialization ---
    init();

    function init() {
        updateDate();
        renderTasks();
        renderCalendar();
        
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
                renderCalendar();
            });
        });

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;
                
                if (currentView === 'list') {
                    listView.classList.remove('hidden');
                    calendarView.classList.add('hidden');
                    selectedCalendarDate = null; // reset filter
                    renderTasks();
                } else {
                    listView.classList.add('hidden');
                    calendarView.classList.remove('hidden');
                    renderCalendar();
                }
            });
        });

        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // --- Core Logic ---
    function handleAddTask() {
        const text = taskInput.value.trim();
        const dueDate = taskDueDate.value; // YYYY-MM-DD format
        
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: dueDate || null
        };

        tasks.push(newTask);
        taskInput.value = '';
        taskDueDate.value = '';
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
        const li = document.querySelector(`[data-id="${id}"]`);
        if (li) {
            li.style.opacity = '0';
            li.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveAndRender();
            }, 200); 
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
        if (currentView === 'list' || selectedCalendarDate) {
            renderTasks();
        }
        renderCalendar();
    }

    function renderTasks() {
        // 1. Filter by status
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        // 2. Filter by selected calendar date (if any)
        if (selectedCalendarDate) {
            filteredTasks = filteredTasks.filter(t => t.dueDate === selectedCalendarDate);
        }

        // 3. Sort: incomplete first, then by creation date
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
                
                let dateStr = '';
                if (task.dueDate) {
                    // task.dueDate is YYYY-MM-DD. Parse local time properly
                    const [y, m, d] = task.dueDate.split('-');
                    const dateObj = new Date(y, m - 1, d);
                    dateStr = `Due: ` + dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else {
                    const dateObj = new Date(task.createdAt);
                    dateStr = `Added: ` + dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }

                li.innerHTML = `
                    <button class="task-checkbox-btn" aria-label="Toggle Completion">
                        <i class='bx bx-check'></i>
                    </button>
                    <div class="task-content">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        <span class="task-date">${dateStr}</span>
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

    // --- Calendar Logic ---
    function renderCalendar() {
        if(currentView !== 'calendar') {
            updateStats(); // Make sure stats are updated even if calendar isn't rendering
            return;
        }
        
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Month name for header
        calendarMonthYear.textContent = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayCell = createDayCell(daysInPrevMonth - i, year, month - 1, true);
            calendarGrid.appendChild(dayCell);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = createDayCell(i, year, month, false);
            calendarGrid.appendChild(dayCell);
        }

        // Next month days to fill grid (42 cells total)
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const dayCell = createDayCell(i, year, month + 1, true);
            calendarGrid.appendChild(dayCell);
        }
    }

    function createDayCell(day, year, month, isOtherMonth) {
        const cellDate = new Date(year, month, day);
        // Correctly format local date to YYYY-MM-DD
        const formattedDate = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
        
        const div = document.createElement('div');
        div.className = 'calendar-day';
        if (isOtherMonth) div.classList.add('other-month');
        
        const today = new Date();
        if (!isOtherMonth && 
            day === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear()) {
            div.classList.add('today');
        }

        if (selectedCalendarDate === formattedDate) {
            div.style.background = 'rgba(99, 102, 241, 0.3)';
        }

        // Check if there are tasks for this day
        // respect current filter
        let dateTasks = tasks.filter(t => t.dueDate === formattedDate);
        if (currentFilter === 'active') {
            dateTasks = dateTasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            dateTasks = dateTasks.filter(t => t.completed);
        }

        if (dateTasks.length > 0) {
            div.classList.add('has-tasks');
        }

        div.innerHTML = `<span class="day-number">${day}</span>`;
        
        div.addEventListener('click', () => {
            if (selectedCalendarDate === formattedDate) {
                // Deselect if already selected
                selectedCalendarDate = null;
                // Go back to showing the calendar full view or wait, 
                // in calendar view, clicking a day should show its tasks BELOW it, or switch to list view.
                // Let's just switch back to list view to show the tasks for that day.
            } else {
                selectedCalendarDate = formattedDate;
                // switch to list view
                document.querySelector('.toggle-btn[data-view="list"]').click();
            }
        });

        return div;
    }

    // --- Utilities ---
    function updateStats() {
        const completedCount = tasks.filter(t => t.completed).length;
        statCompleted.textContent = completedCount;
        statTotal.textContent = tasks.length;
    }

    function updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString(undefined, options);
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
