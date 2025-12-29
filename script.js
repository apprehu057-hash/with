document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');

    // Load from local storage (optional enhancement for persistence)
    // const savedTodos = JSON.parse(localStorage.getItem('todos')) || [];
    // savedTodos.forEach(todo => createTodoElement(todo.text, todo.completed));

    function updateTaskCount() {
        const count = todoList.children.length;
        const countDisplay = document.getElementById('task-count');
        if (countDisplay) countDisplay.textContent = count;
    }

    function createTodoElement(text, completed = false) {
        const li = document.createElement('li');
        if (completed) li.classList.add('completed');

        const leftContent = document.createElement('div');
        leftContent.classList.add('left-content');

        // Create Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;
        checkbox.classList.add('custom-checkbox');

        // Toggle completion on checkbox change
        checkbox.addEventListener('change', () => {
            li.classList.toggle('completed');
        });

        const span = document.createElement('span');
        span.textContent = text;
        span.classList.add('task-text');

        leftContent.appendChild(checkbox);
        leftContent.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            li.style.transform = 'translateX(10px)';
            li.style.opacity = '0';
            setTimeout(() => {
                li.remove();
                updateTaskCount();
            }, 200);
        });

        li.appendChild(leftContent);
        li.appendChild(deleteBtn);

        // Append to list
        todoList.appendChild(li); // Changed from prepend to append for "Add at bottom" feel, or keep prepend? Usually add at bottom for lists like this but let's stick to user pref or default.
        // Actually, "Add to-do" usually adds to bottom in desktop apps like Reminders/To-Do.
        // Let's scroll to bottom if needed.
        updateTaskCount();
    }

    function addTodo() {
        const text = input.value.trim();
        if (text) {
            createTodoElement(text);
            input.value = '';
            input.focus();
            // Scroll to bottom
            const container = document.querySelector('.task-list-container');
            container.scrollTop = container.scrollHeight;
        }
    }

    // New Input handling (no button click needed for bottom input usually, just Enter)
    // But we have a button in JS logic? The previous code had `addBtn`.
    // In new HTML I removed the explicit "Add" button click, it's just an icon.
    // So I will remove the addBtn listener or adapt it if I kept a button.
    // In the new HTML: <div class="input-area"><button class="add-icon">+</button><input...></div>
    // The button is decorative or can be clicked.

    const addIcon = document.querySelector('.add-icon');
    if (addIcon) {
        addIcon.addEventListener('click', addTodo);
    }

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // Add some default items for demo purposes if list is empty
    if (todoList.children.length === 0) {
        createTodoElement("CEO 과정 - 온라인 강의 + 오프라인 워크샵");
        createTodoElement("N8N 워크플로우 구현");
        createTodoElement("바이브 코딩을 이용한 코드 다중 체크 방법 구현");
    }
});
