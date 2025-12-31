document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const headerTitle = document.getElementById('header-title');
    const searchInput = document.querySelector('.search-box input');
    let searchQuery = '';

    // Sidebar Toggle Logic
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // Mobile: Toggle Overlay Mode
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            } else {
                // Desktop: Toggle Collapse Mode
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // --- State Management ---
    // Default list is now 'Inbox'
    let currentList = localStorage.getItem('currentList') || 'Inbox';

    function loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : {
            'Inbox': [
                { id: 1, text: 'Welcome to your new Inbox', completed: false, dateAdded: new Date().toISOString(), isToday: true, priority: false },
                { id: 2, text: 'Try adding a task below', completed: false, dateAdded: new Date().toISOString(), isToday: false, priority: false }
            ],
            'Personal': [],
            'Work': []
        };
    }

    let tasks = loadTasks();

    // Migrating old data structure if needed (simple check)
    if (!tasks['Inbox'] && tasks['생활관리']) {
        // Assume migration needed or just fresh start for Inbox structure
        // For now, let's keep it simple. If 'Inbox' doesn't exist, Create it.
        tasks['Inbox'] = [];
    }

    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        localStorage.setItem('currentList', currentList);
    }

    function renderTasks() {
        todoList.innerHTML = '';
        let currentTasks = [];
        const isSearch = !!searchQuery;

        if (isSearch) {
            Object.keys(tasks).forEach(listName => {
                tasks[listName].forEach(task => {
                    if (task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
                        currentTasks.push({ ...task, originalList: listName });
                    }
                });
            });
            headerTitle.textContent = `검색 결과: "${searchQuery}"`;
        } else {
            // Special Views
            if (currentList === 'Today') {
                const todayStr = new Date().toDateString();
                Object.keys(tasks).forEach(listName => {
                    tasks[listName].forEach(task => {
                        // Check isToday flag OR duplicate check based on date if we had date picker
                        if (task.isToday) {
                            currentTasks.push({ ...task, originalList: listName });
                        }
                    });
                });
                headerTitle.textContent = '오늘 할 일 (Today)';
            } else if (currentList === 'Upcoming') {
                // Mockup logic for Upcoming since we don't have full dates yet
                // Showing all tasks for now or just random ones to demonstrate
                Object.keys(tasks).forEach(listName => {
                    tasks[listName].forEach(task => {
                        if (!task.completed) {
                            currentTasks.push({ ...task, originalList: listName });
                        }
                    });
                });
                headerTitle.textContent = '준비 (Upcoming)';
            } else if (currentList === 'Important') {
                Object.keys(tasks).forEach(listName => {
                    tasks[listName].forEach(task => {
                        if (task.priority) {
                            currentTasks.push({ ...task, originalList: listName });
                        }
                    });
                });
                headerTitle.textContent = '중요';
            } else {
                // Standard List (Inbox, Projects)
                if (!tasks[currentList]) tasks[currentList] = [];
                currentTasks = tasks[currentList];
                headerTitle.textContent = currentList === 'Inbox' ? '관리함 (Inbox)' : currentList;
            }
        }

        if (currentTasks.length === 0) {
            todoList.innerHTML = `
                <li style="justify-content:center; border:none; color:#aaa; margin-top:50px;">
                    ${isSearch ? '검색 결과가 없습니다.' : '할 일이 없습니다.'}
                </li>
            `;
            updateCounts();
            return;
        }

        // Sort: Active first, then by ID (newest last usually, or push order)
        // Simple sort: Completed last
        currentTasks.sort((a, b) => a.completed - b.completed);

        currentTasks.forEach((task) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.classList.add('custom-checkbox');
            checkbox.addEventListener('change', () => {
                // Find actual task ref if in special view
                const realTask = findTaskRef(task);
                if (realTask) {
                    realTask.completed = checkbox.checked;
                    saveTasks();
                    renderTasks(); // Re-render to sort/update styling
                    updateCounts();
                }
            });

            const span = document.createElement('span');
            span.textContent = task.text;
            span.classList.add('task-text');
            // Allow editing text on click
            span.addEventListener('click', () => {
                const newText = prompt("할 일 수정:", task.text);
                if (newText !== null) {
                    const realTask = findTaskRef(task);
                    if (realTask) {
                        realTask.text = newText || realTask.text;
                        saveTasks();
                        renderTasks();
                    }
                }
            });

            // Meta/Actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions-div';
            actionsDiv.style.display = 'flex';

            // Priority Button
            const priorityBtn = document.createElement('button');
            priorityBtn.className = `priority-btn ${task.priority ? 'active' : ''}`;
            priorityBtn.innerHTML = todoIcons.star;
            priorityBtn.title = "중요 표시";
            priorityBtn.onclick = (e) => {
                e.stopPropagation();
                const realTask = findTaskRef(task);
                if (realTask) {
                    realTask.priority = !realTask.priority;
                    saveTasks();
                    renderTasks();
                    updateCounts();
                }
            };

            // Today Button (Sun)
            const todayBtn = document.createElement('button');
            todayBtn.className = `today-btn ${task.isToday ? 'active' : ''}`;
            todayBtn.innerHTML = todoIcons.sun; // Using sun icon for Today
            todayBtn.title = "오늘 할 일에 추가";
            todayBtn.onclick = (e) => {
                e.stopPropagation();
                const realTask = findTaskRef(task);
                if (realTask) {
                    realTask.isToday = !realTask.isToday;
                    saveTasks();
                    renderTasks();
                    updateCounts();
                }
            };

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = todoIcons.trash;
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm("이 작업을 삭제하시겠습니까?")) {
                    deleteTask(task);
                }
            };

            // Add list tag if in special view
            if (isSearch || ['Today', 'Upcoming', 'Important'].includes(currentList)) {
                if (task.originalList && task.originalList !== 'Inbox') {
                    const tag = document.createElement('span');
                    tag.textContent = task.originalList;
                    tag.style.fontSize = '10px';
                    tag.style.color = '#888';
                    tag.style.marginRight = '10px';
                    li.appendChild(tag);
                }
            }

            li.appendChild(checkbox);
            li.appendChild(span);

            actionsDiv.appendChild(todayBtn);
            actionsDiv.appendChild(priorityBtn);
            actionsDiv.appendChild(deleteBtn);
            li.appendChild(actionsDiv);

            todoList.appendChild(li);
        });

        updateCounts();
    }

    function findTaskRef(taskCopy) {
        // Helper to find the mutable task object in the main 'tasks' structure
        // Since we spread {...task} in special views, we have a copy.
        // We need the reference.
        let listName = taskCopy.originalList;
        if (!listName) {
            // If in normal view, taskCopy might BE the reference if we didn't spread (but we usually do render clean)
            // But let's look it up to be safe if we change render logic
            listName = currentList;
        }
        if (!tasks[listName]) return null;
        return tasks[listName].find(t => t.id === taskCopy.id) || tasks[listName].find(t => t.text === taskCopy.text); // Fallback to text if ID missing in old data
    }

    function deleteTask(task) {
        let listName = task.originalList || currentList;
        if (tasks[listName]) {
            tasks[listName] = tasks[listName].filter(t => t.id !== task.id && t.text !== task.text);
            saveTasks();
            renderTasks();
            updateCounts();
            renderSidebarProjects();
        }
    }

    function addTodo() {
        const text = input.value.trim();
        if (text) {
            let targetList = currentList;
            if (['Today', 'Upcoming', 'Important'].includes(currentList)) {
                targetList = 'Inbox'; // Default to Inbox if adding from special view
            }

            if (!tasks[targetList]) tasks[targetList] = [];

            const newTask = {
                id: Date.now(),
                text: text,
                completed: false,
                isToday: currentList === 'Today', // If added in Today, mark as Today
                priority: currentList === 'Important',
                dateAdded: new Date().toISOString()
            };

            tasks[targetList].push(newTask);

            input.value = '';
            saveTasks();
            renderTasks();
            updateCounts();
            renderSidebarProjects();
        }
    }

    // Input handlers
    const addIcon = document.querySelector('.add-icon');
    if (addIcon) addIcon.addEventListener('click', addTodo);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });

    // Sidebar Navigation & Counts
    function updateCounts() {
        // Inbox count
        const inboxCount = tasks['Inbox'] ? tasks['Inbox'].filter(t => !t.completed).length : 0;
        document.getElementById('nav-inbox-count').textContent = inboxCount || '';

        // Today count (Global)
        let todayCount = 0;
        Object.values(tasks).forEach(list => {
            todayCount += list.filter(t => !t.completed && t.isToday).length;
        });
        document.getElementById('nav-today-count').textContent = todayCount || '';
    }

    function renderSidebarProjects() {
        const container = document.querySelector('.lists-section');
        // Clear existing lists except the title
        const title = container.querySelector('.section-title');
        container.innerHTML = '';
        container.appendChild(title);

        Object.keys(tasks).forEach(listName => {
            // Render all user lists except 'Inbox' (which has its own nav item)
            if (listName === 'Inbox') return;

            const count = tasks[listName].filter(t => !t.completed).length;

            const a = document.createElement('a');
            a.href = '#';
            a.className = `nav-item ${currentList === listName ? 'active' : ''}`;
            a.innerHTML = `
                <span style="width:10px; height:10px; border-radius:50%; background:${stringToColor(listName)}; margin-right:5px;"></span>
                <span>${listName}</span>
                <span class="count">${count || ''}</span>
            `;
            a.onclick = (e) => {
                e.preventDefault();
                switchList(listName);
            };
            container.appendChild(a);
        });
    }

    function switchList(name) {
        currentList = name;
        saveTasks();
        renderTasks();
        renderSidebarProjects();
        // Update nav active states
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        if (name === 'Inbox') document.getElementById('nav-inbox').classList.add('active');
        else if (name === 'Today') document.getElementById('nav-today').classList.add('active');
        else if (name === 'Upcoming') document.getElementById('nav-upcoming').classList.add('active');
        else if (name === 'Important') document.getElementById('nav-important').classList.add('active');

        updateMobileChips(name);
        // For project lists, the renderSidebarProjects handles the active class re-render
    }

    // Attach Sidebar Event Listeners
    document.getElementById('nav-inbox').onclick = () => switchList('Inbox');
    document.getElementById('nav-today').onclick = () => switchList('Today');
    document.getElementById('nav-upcoming').onclick = () => switchList('Upcoming');
    document.getElementById('nav-important').onclick = () => switchList('Important');

    // Mobile Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const target = chip.getAttribute('data-target');
            switchList(target);
        });
    });

    function updateMobileChips(name) {
        document.querySelectorAll('.filter-chip').forEach(chip => {
            if (chip.getAttribute('data-target') === name) {
                chip.classList.add('active');
                // Optional: Scroll to active chip
                chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } else {
                chip.classList.remove('active');
            }
        });
    }

    // New List Logic
    const newListBtn = document.getElementById('new-list-btn');
    const modal = document.getElementById('modal-container');
    const modalInput = document.getElementById('modal-input');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    newListBtn.onclick = () => {
        modal.style.display = 'flex';
        modalInput.focus();
    };

    const closeModal = () => {
        modal.style.display = 'none';
        modalInput.value = '';
    };

    modalCancel.onclick = closeModal;

    modalConfirm.onclick = () => {
        const name = modalInput.value.trim();
        if (name) {
            if (tasks[name]) {
                alert('이미 존재하는 프로젝트입니다.');
                return;
            }
            tasks[name] = [];
            saveTasks();
            renderSidebarProjects();
            switchList(name);
            closeModal();
        }
    };

    // Hash string to color for list bullets
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    // Icons
    const todoIcons = {
        trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
        star: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        sun: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    };

    // Init
    renderSidebarProjects();
    switchList(currentList);
});
