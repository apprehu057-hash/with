document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const headerTitle = document.querySelector('.header-titles h1');
    const taskCountSpan = document.getElementById('task-count');

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

    // State Management
    // State Management
    let currentList = 'Daily Memo';

    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : {
            'Daily Memo': [
                { text: "Buy groceries", completed: false, priority: false },
                { text: "Walk the dog", completed: false, priority: false },
                { text: "Finish project", completed: false, priority: true }
            ]
        };
    }

    let tasks = loadTasks();

    // Ensure default list exists if starting fresh or renamed
    if (!tasks[currentList]) {
        tasks[currentList] = [
            { text: "Buy groceries", completed: false, priority: false },
            { text: "Walk the dog", completed: false, priority: false },
            { text: "Finish project", completed: false, priority: true }
        ];
        saveTasks();
    }

    function renderTasks() {
        todoList.innerHTML = ''; // Clear current view
        const currentTasks = tasks[currentList] || [];

        // Check for empty state
        if (currentTasks.length === 0) {
            todoList.innerHTML = `
                <li class="empty-state">
                    <div class="text">이제 쉬어가기</div>
                </li>
            `;
            updateTaskCount();
            return;
        }

        // Sort tasks: Priority first
        currentTasks.sort((a, b) => {
            return (b.priority === true) - (a.priority === true);
        });

        currentTasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            const leftContent = document.createElement('div');
            leftContent.classList.add('left-content');

            // Priority Button
            const starBtn = document.createElement('button');
            starBtn.className = `priority-btn ${task.priority ? 'active' : ''}`;
            starBtn.innerHTML = '★'; // Or SVG star
            starBtn.title = "Toggle Priority";

            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                task.priority = !task.priority;
                saveTasks();
                renderTasks();
            });

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.classList.add('custom-checkbox');

            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                li.classList.toggle('completed');
                saveTasks();
            });

            const span = document.createElement('span');
            span.textContent = task.text;
            span.classList.add('task-text');

            // Edit Button
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✎'; // Pencil icon
            editBtn.className = 'edit-btn';
            editBtn.title = "Edit Task";

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Replace span with input
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'edit-input';

                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText) {
                        task.text = newText;
                        saveTasks();
                        renderTasks();
                    } else {
                        // If empty, revert or delete? Let's revert for now or stay in edit mode. 
                        // Reverting is safer.
                        renderTasks();
                    }
                };

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    }
                });

                input.addEventListener('blur', () => {
                    saveEdit();
                });

                leftContent.replaceChild(input, span);
                input.focus();
            });

            leftContent.appendChild(starBtn);
            leftContent.appendChild(checkbox);
            leftContent.appendChild(span);
            // We append editBtn to the right side or near the delete button? 
            // The prompt implied clicking the item enters edit mode OR a button.
            // "오늘 할 일 항목을 누르면 편집 모드 진입: 버튼을 누르면 해당 항목을 바로 수정할 수 있도록"
            // Let's put the edit button near the delete button (right side) or before text?
            // Usually modify actions are grouped. Let's put it on the right side next to delete button.
            // But waiting, flex layout: li has `space-between`. Left content has checkbox+text.
            // Let's add edit button to `li` (right side) before delete button.

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                // Remove from state
                tasks[currentList].splice(index, 1);
                saveTasks();
                // Re-render to update indices
                renderTasks();
            });

            li.appendChild(leftContent);

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(actionsDiv);

            todoList.appendChild(li);
        });

        // Update counts
        updateTaskCount();
    }

    function updateTaskCount() {
        // Update count for the *current* list in the sidebar if it exists
        // This is a bit tricky with dynamic IDs, so for now we update the main "My to-do" count
        // or we need a way to link sidebar items to state.
        // For simplicity in this demo, we'll update the 'My to-do' count if it's the current list
        // or just rely on re-clicking to update?

        // Let's just update the visible count on the active nav item
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            const countSpan = activeNav.querySelector('.count');
            if (countSpan) {
                countSpan.textContent = (tasks[currentList] || []).length;
            }
        }
    }

    function addTask(text) {
        if (!tasks[currentList]) {
            tasks[currentList] = [];
        }
        tasks[currentList].push({ text: text, completed: false, priority: false });
        saveTasks();
        renderTasks();

        // Scroll to bottom
        const container = document.querySelector('.task-list-container');
        if (container) container.scrollTop = container.scrollHeight;
    }

    function addTodo() {
        const text = input.value.trim();
        if (text) {
            addTask(text);
            input.value = '';
            input.focus();
        }
    }

    // Input handlers
    const addIcon = document.querySelector('.add-icon');
    if (addIcon) addIcon.addEventListener('click', addTodo);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Sidebar Navigation Logic
    function switchList(listName) {
        currentList = listName;
        headerTitle.textContent = listName;
        renderTasks();
    }

    // Activate default list
    renderTasks();

    const newListBtn = document.getElementById('new-list-btn');

    // New List Feature (Custom Modal)
    const modalContainer = document.getElementById('modal-container');
    const modalInput = document.getElementById('modal-input');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    function openModal() {
        modalContainer.classList.add('active');
        modalInput.value = `페이지 ${Object.keys(tasks).length + 1}`;
        setTimeout(() => modalInput.focus(), 100);
        modalInput.select();
    }

    function closeModal() {
        modalContainer.classList.remove('active');
    }

    function handleCreateList() {
        const listName = modalInput.value.trim();
        if (listName && !tasks[listName]) {
            tasks[listName] = [];
            saveTasks();

            const listsSection = document.querySelector('.lists-section');
            const newLink = document.createElement('a');
            newLink.href = "#";
            newLink.className = "nav-item";
            newLink.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>${listName}</span>
                <span class="count">0</span>
            `;
            listsSection.appendChild(newLink);

            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                newLink.classList.add('active');
                switchList(listName);
            });

            newLink.click();
            closeModal();
        } else if (tasks[listName]) {
            alert("이미 존재하는 페이지 이름입니다.");
        }
    }

    if (newListBtn) {
        newListBtn.addEventListener('click', openModal);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }

    if (modalConfirm) {
        modalConfirm.addEventListener('click', handleCreateList);
    }

    modalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreateList();
    });

    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) closeModal();
    });

    // Attach listener to initial "My to-do" link
    const initialLink = document.querySelector('.lists-section .nav-item');
    if (initialLink) {
        initialLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            initialLink.classList.add('active');
            switchList('하루 메모');
        });
    }
});
