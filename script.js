document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const headerTitle = document.querySelector('.header-titles h1');
    const taskCountSpan = document.getElementById('task-count');

    // State Management
    let currentList = 'My To-Do List';
    // Tasks object: { 'ListName': [ { text: '...', completed: false } ] }
    let tasks = {
        'My To-Do List': [
            { text: "Buy groceries", completed: false },
            { text: "Walk the dog", completed: false },
            { text: "Complete the project", completed: false }
        ]
    };

    function renderTasks() {
        todoList.innerHTML = ''; // Clear current view
        const currentTasks = tasks[currentList] || [];

        currentTasks.forEach((task, index) => {
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
                // Could save to localStorage here
            });

            const span = document.createElement('span');
            span.textContent = task.text;
            span.classList.add('task-text');

            leftContent.appendChild(checkbox);
            leftContent.appendChild(span);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                // Remove from state
                tasks[currentList].splice(index, 1);
                // Re-render to update indices
                renderTasks();
            });

            li.appendChild(leftContent);
            li.appendChild(deleteBtn);

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
        tasks[currentList].push({ text: text, completed: false });
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

    // New List Feature
    const newListBtn = document.getElementById('new-list-btn');
    if (newListBtn) {
        newListBtn.addEventListener('click', () => {
            const listName = prompt("새 목록의 이름을 입력하세요:", `목록 ${Object.keys(tasks).length + 1}`);
            if (listName && !tasks[listName]) {
                // Initialize empty list
                tasks[listName] = [];

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

                // Add click listener
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                    newLink.classList.add('active');
                    switchList(listName);
                });

                // Automatically switch to new list
                newLink.click();
            } else if (tasks[listName]) {
                alert("이미 존재하는 목록 이름입니다.");
            }
        });
    }

    // Attach listener to initial "My to-do" link
    const initialLink = document.querySelector('.lists-section .nav-item');
    if (initialLink) {
        initialLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            initialLink.classList.add('active');
            switchList('My To-Do List');
        });
    }
});
