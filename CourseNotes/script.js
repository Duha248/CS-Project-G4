document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://b244ac72-2afa-49d8-b0f8-d1fdb98b830e-00-37njybe0trgwi.pike.replit.dev/Notes.php";
    const grid = document.querySelector(".grid");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.getElementById("sort");
    const form = document.querySelector("form");
    const errorDisplay = document.getElementById("errorMessages");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const notesPerPage = 5;
    let notes = [];
    let currentPage = 1;
    let totalPages = 1;

    // ========== Fetching & Rendering ==========
    const showLoading = () => {
        grid.innerHTML = "<p>Loading notes...</p>";
    };

    const showError = (message) => {
        grid.innerHTML = `<p style="color: red;">${message}</p>`;
    };

    const fetchNotes = async (page = 1) => {
        try {
            showLoading();
            const res = await fetch(`${API_URL}?_page=${page}&_limit=${notesPerPage}`);
            if (!res.ok) throw new Error("Failed to fetch notes.");
            
            const totalCount = res.headers.get("X-Total-Count");
            totalPages = Math.ceil(totalCount / notesPerPage);
            const data = await res.json();

            notes = data.map(item => ({
    title: item.title,
    author: item.author,
    summary: item.summary,
    date: item.date


            }));

            renderNotes(notes);
            updatePaginationButtons();
        } catch (err) {
            showError(err.message);
        }
    };

    const renderNotes = (list) => {
        grid.innerHTML = "";
        if (!list.length) {
            grid.innerHTML = "<p>No matching notes found. Try Another!</p>";
            return;
        }

        list.forEach(note => {
            const article = document.createElement("article");
            article.innerHTML = `
                <h3>${note.title}</h3>
                <p>Uploaded by: ${note.author}</p>
                <p>Summary: ${note.summary}</p>
                <p>Upload Date: ${note.date}</p>
            `;
            const btn = document.createElement("button");
            btn.textContent = "View Notes";
            btn.addEventListener("click", () => {
                localStorage.setItem("selectedNote", JSON.stringify(note));
                window.location.href = "NoteDetail.html";
            });
            article.appendChild(btn);
            grid.appendChild(article);
        });
    };

    // ========== Search, Sort, Pagination ==========
    const searchNotes = () => {
        const query = searchInput.value.toLowerCase();
        const filtered = notes.filter(n => n.title.toLowerCase().includes(query));
        renderNotes(filtered);
    };

    const sortNotes = () => {
        const value = sortSelect.value;
        if (value === "a-z") notes.sort((a, b) => a.title.localeCompare(b.title));
        else if (value === "z-a") notes.sort((a, b) => b.title.localeCompare(a.title));
        else if (value === "newest") notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (value === "oldest") notes.sort((a, b) => new Date(a.date) - new Date(b.date));

        renderNotes(notes);
    };

    const updatePaginationButtons = () => {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    };

    // ========== Form Handling ==========
    const addNote = (e) => {
    e.preventDefault();
    const course = document.getElementById("course").value.trim();
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const date = document.getElementById("date").value.trim();
    const content = document.getElementById("content").value.trim();

    errorDisplay.innerHTML = "";

    if (!course || !title || !author || !date || !content) {
        errorDisplay.textContent = "Please fill in all fields.";
        return;
    }

    const newNote = {
        title: `${course} - ${title}`,
        author,
        summary: content,
        date
    };

    // Send POST request to backend
    fetch("https://b244ac72-2afa-49d8-b0f8-d1fdb98b830e-00-37njybe0trgwi.pike.replit.dev/Notes.php", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Note added successfully:", data);
        errorDisplay.textContent = "Note uploaded successfully! Thank You!";
        fetchNotes(); // Refresh the list after adding a new note
    })
    .catch(err => {
        console.error("Failed to add note:", err);
        errorDisplay.textContent = "Failed to add note.";
    });
};


    // ========== Event Listeners ==========
    form.addEventListener("submit", addNote);
    searchInput.addEventListener("input", searchNotes);
    sortSelect.addEventListener("change", sortNotes);
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchNotes(currentPage);
        }
    });
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchNotes(currentPage);
        }
    });

    fetchNotes(); // initial fetch
});
