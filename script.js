document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const headerTitle = document.querySelector('.header-titles h1');
    const taskCountSpan = document.getElementById('task-count');
    const searchInput = document.querySelector('.search-box input');
    let searchQuery = '';

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // --- State Management ---
    let currentList = localStorage.getItem('currentList') || 'My To-Do List';

    function loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : {
            'My To-Do List': [
                { text: "Buy groceries", completed: false, priority: false, isToday: false, dateAdded: new Date().toISOString() },
                { text: "Walk the dog", completed: false, priority: false, isToday: true, dateAdded: new Date().toISOString() },
                { text: "Finish project", completed: false, priority: true, isToday: false, dateAdded: new Date().toISOString() }
            ]
        };
    }

    let tasks = loadTasks();

    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        localStorage.setItem('currentList', currentList);
    }

    // Ensure currentList is valid, otherwise fallback
    if (!tasks[currentList]) {
        currentList = Object.keys(tasks)[0] || 'My To-Do List';
        if (!tasks[currentList]) {
            tasks[currentList] = [];
        }
    }

    function renderTasks() {
        todoList.innerHTML = '';
        let currentTasks = [];
        let isFilterMode = false;

        if (searchQuery) {
            isFilterMode = true;
            Object.keys(tasks).forEach(listName => {
                tasks[listName].forEach(task => {
                    if (task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
                        // Clone task to avoid mutation issues during filtering if needed
                        currentTasks.push({ ...task, originalList: listName });
                    }
                });
            });
        } else if (currentList === 'Today') {
            isFilterMode = true;
            const today = new Date().toDateString();
            Object.keys(tasks).forEach(listName => {
                tasks[listName].forEach(task => {
                    const isAddedToday = new Date(task.dateAdded).toDateString() === today;
                    if (isAddedToday || task.isToday) {
                        currentTasks.push({ ...task, originalList: listName });
                    }
                });
            });
        } else if (currentList === 'Important') {
            isFilterMode = true;
            Object.values(tasks).forEach(listTasks => {
                listTasks.forEach(task => {
                    if (task.priority) {
                        currentTasks.push(task);
                    }
                });
            });
        } else if (currentList === 'Tasks') {
            isFilterMode = true;
            Object.keys(tasks).forEach(listName => {
                tasks[listName].forEach(task => {
                    currentTasks.push({ ...task, originalList: listName });
                });
            });
        } else {
            currentTasks = tasks[currentList] || [];
        }

        if (currentTasks.length === 0) {
            todoList.innerHTML = `
                <li class="empty-state">
                    <div class="text">${searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다` : '이제 쉬어가기'}</div>
                </li>
            `;
            // Update counts even if no tasks
            updateMainFilterCounts();
            return;
        }

        headerTitle.textContent = searchQuery ? `Search: ${searchQuery}` : currentList;

        // Sort: Priority first, then original order
        const sortedTasks = [...currentTasks].sort((a, b) => (b.priority === true) - (a.priority === true));

        sortedTasks.forEach((task) => {
            const originalIndex = currentTasks.indexOf(task);
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            const leftContent = document.createElement('div');
            leftContent.classList.add('left-content');

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.classList.add('custom-checkbox');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                li.classList.toggle('completed');

                // Disable/enable bookmark buttons based on completion
                if (task.completed) {
                    starBtn.disabled = true;
                    todayBtn.disabled = true;
                    starBtn.style.opacity = '0.3';
                    todayBtn.style.opacity = '0.3';
                    starBtn.style.cursor = 'not-allowed';
                    todayBtn.style.cursor = 'not-allowed';
                } else {
                    starBtn.disabled = false;
                    todayBtn.disabled = false;
                    starBtn.style.opacity = '';
                    todayBtn.style.opacity = '';
                    starBtn.style.cursor = 'pointer';
                    todayBtn.style.cursor = 'pointer';
                }

                saveTasks();
                updateMainFilterCounts();
                // Update count when task is checked/unchecked
            });

            const span = document.createElement('span');
            span.textContent = task.text;
            span.classList.add('task-text');

            // Priority (Important) Button - Using Unified Bookmark SVG
            const starBtn = document.createElement('button');
            starBtn.className = `priority-btn ${task.priority ? 'active' : ''}`;
            starBtn.title = "Mark as Important";
            starBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${task.priority ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Prevent toggling if task is completed
                if (task.completed) return;

                task.priority = !task.priority;

                // Update button visual state without full re-render
                if (task.priority) {
                    starBtn.classList.add('active');
                    starBtn.querySelector('svg').setAttribute('fill', 'currentColor');
                } else {
                    starBtn.classList.remove('active');
                    starBtn.querySelector('svg').setAttribute('fill', 'none');
                }

                saveTasks();
                updateMainFilterCounts();
            });

            // Today Toggle Button - Using Unified Bookmark SVG
            const todayBtn = document.createElement('button');
            todayBtn.className = `today-btn ${task.isToday ? 'active' : ''}`;
            todayBtn.title = "Add to Today";
            todayBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${task.isToday ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
            todayBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Prevent toggling if task is completed
                if (task.completed) return;

                task.isToday = !task.isToday;

                // Update button visual state without full re-render
                if (task.isToday) {
                    todayBtn.classList.add('active');
                    todayBtn.querySelector('svg').setAttribute('fill', 'currentColor');
                } else {
                    todayBtn.classList.remove('active');
                    todayBtn.querySelector('svg').setAttribute('fill', 'none');
                }

                saveTasks();
                updateMainFilterCounts();
            });

            // Edit
            const editBtn = document.createElement('button');
            editBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            `;
            editBtn.className = 'edit-btn';
            editBtn.title = "Edit Task";
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.className = 'edit-input';

                const saveEdit = () => {
                    const newText = editInput.value.trim();
                    if (newText) {
                        task.text = newText;
                        saveTasks();
                        renderTasks();
                    } else {
                        renderTasks();
                    }
                };

                editInput.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') saveEdit(); });
                editInput.addEventListener('blur', saveEdit);
                leftContent.replaceChild(editInput, span);
                editInput.focus();
            });

            leftContent.appendChild(checkbox);
            leftContent.appendChild(span);

            // Set initial disabled state for bookmark buttons if task is completed
            if (task.completed) {
                starBtn.disabled = true;
                todayBtn.disabled = true;
                starBtn.style.opacity = '0.3';
                todayBtn.style.opacity = '0.3';
                starBtn.style.cursor = 'not-allowed';
                todayBtn.style.cursor = 'not-allowed';
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions-div';
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';
            actionsDiv.style.gap = '8px';

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                li.classList.add('removing');
                setTimeout(() => {
                    const listName = task.originalList || Object.keys(tasks).find(ln => tasks[ln].includes(task));
                    const listTasks = tasks[listName];
                    const idx = listTasks.indexOf(task);
                    if (idx > -1) {
                        listTasks.splice(idx, 1);
                        saveTasks();
                        renderTasks();
                        renderSidebar();
                    }
                }, 300);
            });

            actionsDiv.appendChild(starBtn);
            actionsDiv.appendChild(todayBtn);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            li.appendChild(leftContent);
            li.appendChild(actionsDiv);

            // Add list name tag if in search/filter mode
            if (searchQuery || currentList === 'Today' || currentList === 'Important') {
                const listName = task.originalList || Object.keys(tasks).find(ln => tasks[ln].includes(task));
                if (listName) {
                    const tag = document.createElement('span');
                    tag.className = 'list-tag';
                    tag.textContent = listName;
                    tag.style.fontSize = '10px';
                    tag.style.background = '#eee';
                    tag.style.padding = '2px 6px';
                    tag.style.borderRadius = '4px';
                    tag.style.marginLeft = '10px';
                    tag.style.color = '#888';
                    leftContent.appendChild(tag);
                }
            }

            todoList.appendChild(li);
        });

        // Update counts for main filters
        updateMainFilterCounts();
    }

    function updateMainFilterCounts() {
        const todayCount = document.querySelector('#nav-today .count') || createCountBadge('#nav-today');
        const importantCount = document.querySelector('#nav-important .count') || createCountBadge('#nav-important');
        const tasksCount = document.querySelector('#nav-tasks-count');

        const todayDate = new Date().toDateString();
        let tCount = 0;
        let iCount = 0;
        let allTasksCount = 0;

        Object.values(tasks).forEach(listTasks => {
            listTasks.forEach(task => {
                // Only count tasks that are not completed
                if (!task.completed) {
                    const isAddedToday = new Date(task.dateAdded).toDateString() === todayDate;
                    if (isAddedToday || task.isToday) tCount++;
                    if (task.priority) iCount++;
                    allTasksCount++;
                }
            });
        });

        todayCount.textContent = tCount;
        importantCount.textContent = iCount;
        if (tasksCount) tasksCount.textContent = allTasksCount;
    }

    function createCountBadge(selector) {
        const parent = document.querySelector(selector);
        if (!parent) return null;
        const span = document.createElement('span');
        span.className = 'count';
        parent.appendChild(span);
        return span;
    }

    function renderSidebar() {
        // Main Nav Listeners
        const navItems = [
            { id: 'nav-today', name: 'Today', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>' },
            { id: 'nav-important', name: 'Important', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>' },
            { id: 'nav-tasks', name: 'Tasks', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>' }
        ];

        navItems.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.classList.toggle('active', currentList === item.name);
                // Dynamically update icon
                const iconContainer = el.querySelector('svg') || el;
                if (el.querySelector('svg')) {
                    el.querySelector('svg').outerHTML = item.icon;
                } else {
                    const labelMap = { 'Today': '오늘 할 일', 'Important': '중요', 'Tasks': '작업' };
                    el.innerHTML = item.icon + `<span>${labelMap[item.name]}</span>`;
                }

                el.onclick = (e) => {
                    e.preventDefault();
                    switchList(item.name);
                };
            }
        });

        const listsSection = document.querySelector('.lists-section');
        if (!listsSection) return;

        listsSection.innerHTML = '<div class="section-title">Pages</div>';

        Object.keys(tasks).forEach(listName => {
            const navItem = document.createElement('a');
            navItem.href = "#";
            navItem.className = `nav-item ${listName === currentList ? 'active' : ''}`;

            const taskCount = tasks[listName].length;

            navItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>${listName}</span>
                <div class="list-actions">
                    <button class="rename-list-btn" title="Rename">✎</button>
                    <button class="delete-list-btn" title="Delete">✕</button>
                </div>
                <span class="count">${taskCount}</span>
            `;

            navItem.addEventListener('click', (e) => {
                if (e.target.closest('.list-actions')) return;
                e.preventDefault();
                switchList(listName);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            });

            // Delete List
            navItem.querySelector('.delete-list-btn').onclick = (e) => {
                e.stopPropagation();
                if (confirm(`'${listName}' 페이지를 삭제하시겠습니까?`)) {
                    delete tasks[listName];
                    if (currentList === listName) {
                        currentList = Object.keys(tasks)[0] || 'Daily Memo';
                        if (!tasks[currentList]) tasks[currentList] = [];
                    }
                    saveTasks();
                    switchList(currentList);
                }
            };

            // Rename List
            navItem.querySelector('.rename-list-btn').onclick = (e) => {
                e.stopPropagation();
                const newName = prompt("새로운 페이지 이름을 입력하세요:", listName);
                if (newName && newName.trim() && newName !== listName) {
                    if (tasks[newName.trim()]) {
                        alert("이미 존재하는 이름입니다.");
                        return;
                    }
                    tasks[newName.trim()] = tasks[listName];
                    delete tasks[listName];
                    if (currentList === listName) currentList = newName.trim();
                    saveTasks();
                    switchList(currentList);
                }
            };

            listsSection.appendChild(navItem);
        });

        updateMainFilterCounts();
    }

    function switchList(listName) {
        currentList = listName;
        headerTitle.textContent = listName;
        saveTasks();
        renderTasks();
        renderSidebar();
    }

    function addTodo() {
        const text = input.value.trim();
        if (text) {
            // If in filter mode, add to the first list available or a default list
            let listToAddTo = currentList;
            const filterLists = ['Today', 'Important'];
            if (filterLists.includes(currentList)) {
                listToAddTo = Object.keys(tasks)[0] || 'Daily Memo';
            }

            if (!tasks[listToAddTo]) tasks[listToAddTo] = [];
            tasks[listToAddTo].push({
                id: Date.now(),
                text: text,
                completed: false,
                priority: currentList === 'Important',
                isToday: currentList === 'Today',
                dateAdded: new Date().toISOString()
            });
            input.value = '';
            saveTasks();
            renderTasks();
            renderSidebar();

            const container = document.querySelector('.task-list-container');
            if (container) container.scrollTop = container.scrollHeight;
        }
    }

    // Input handlers
    const addIcon = document.querySelector('.add-icon');
    if (addIcon) addIcon.addEventListener('click', addTodo);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });

    // New List Modal
    const newListBtn = document.getElementById('new-list-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalInput = document.getElementById('modal-input');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    function openModal() {
        modalContainer.classList.add('active');
        modalInput.value = `Page ${Object.keys(tasks).length + 1}`;
        setTimeout(() => { modalInput.focus(); modalInput.select(); }, 100);
    }

    function closeModal() {
        modalContainer.classList.remove('active');
    }

    function handleCreateList() {
        const listName = modalInput.value.trim();
        if (listName) {
            if (!tasks[listName]) {
                tasks[listName] = [];
                saveTasks();
                switchList(listName);
                closeModal();
            } else {
                alert("This page already exists.");
            }
        }
    }

    if (newListBtn) newListBtn.addEventListener('click', openModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modalConfirm) modalConfirm.addEventListener('click', handleCreateList);
    modalInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleCreateList(); });
    modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });

    // Search Handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderTasks();
        });
    }

    // Reset Handler
    const navReset = document.getElementById('nav-reset');
    if (navReset) {
        navReset.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                localStorage.removeItem('todoTasks');
                localStorage.removeItem('currentList');
                location.reload();
            }
        });
    }

    // Initial Render
    renderSidebar();
    renderTasks();
    headerTitle.textContent = currentList;
});
