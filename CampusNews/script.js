document.addEventListener("DOMContentLoaded", () => {
    const DB_URL = "https://62c38ef1-428a-43b6-adb0-14c4394e5fc6-00-35p3geligbq4.pike.replit.dev/mainnews.php";
    const newsContainer = document.querySelector(".news");
    const pagination = document.querySelector(".pagination");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.querySelector("select.sorting");
    const numberOfItemsPerPage = 4;
    let currentPage = 1;
    let allNews = [];

    // A method to fetch the data from the database and if any error occurs while fetching the data, it will show it:
    const fetchNews = async () => {
        try {
            newsContainer.innerHTML = `<p>Just a moment, getting the news...</p>`;
            const response = await fetch(DB_URL);
            if (!response.ok) throw new Error("Failed to fetch data.");
            allNews = await response.json();
            renderPage(currentPage);
        } catch (err) {
            newsContainer.innerHTML = `<p style="color:#BF4C4C;">${err.message}</p>`;
        }
    };

    // A method to delete a new post from the database and update the page:
    newsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const newID = e.target.getAttribute("data-id");
            if (!confirm("Would you like to delete this new article?")) return;
            try {
                const res = await fetch(`${DB_URL}?id=${newID}`, {
                    method: "DELETE"
                });
                if (!res.ok) throw new Error("Unable to delete the new.");
                allNews = allNews.filter(r => r.id != newID);
                alert("Successfully deleted the new post.");
                renderPage(currentPage);
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });

    // A method to add comments on a new post and save them in the database:
    newsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("comment-btn")) {
            const newID = e.target.getAttribute("data-id");
            const input = e.target.previousElementSibling;
            const commentText = input.value.trim();
            if (!commentText) {
                alert("Please add a comment before submitting.");
                return;
            }
            try {
                const res = await fetch(DB_URL, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: newID, comment: commentText })
                });
                if (!res.ok) throw new Error("Error while adding the comment.");
                input.value = ""; 
                alert("Comment posted successfully.");
                fetchNews(); 
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });

    // Sorting the news based on the user's selection either new to old OR old to new:
    const getSortedData = () => {
        let filtered = [...allNews];
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(n => n.College.toLowerCase().includes(searchQuery));
        }
        const sortValue = sortSelect.value;
        filtered.sort((a, b) =>
            sortValue === "2" ? a.Date.localeCompare(b.Date) : b.Date.localeCompare(a.Date)
        );
        return filtered;
    };

    // Getting the sorted data and rendering the page, handling the pagination, and displaying a message when there is no data matching the search query:
    const renderPage = (page) => {
        const data = getSortedData();
        const start = (page - 1) * numberOfItemsPerPage;
        const paginated = data.slice(start, start + numberOfItemsPerPage);

        newsContainer.innerHTML = "<h3>News:</h3><br>";
        if (!paginated.length) {
            newsContainer.innerHTML += "<p>Sorry, no news matches your search.</p>";
            return;
        }

        // Showing the news items:
        paginated.forEach(r => {
            const commentsHTML = Array.isArray(r.comments) ? r.comments.map(c => `<li>${c}</li>`).join(""): "";        
            newsContainer.innerHTML += `
                <details>
                    <summary>
                        <p><strong>Title:</strong> ${r.Title}</p> 
                        <p><strong>College:</strong> ${r.College}</p> 
                        <p><strong>Year:</strong> ${r.Date}</p>
                    </summary>
                    <p><strong>Author:</strong> ${r.Author}</p>
                    <p><strong>News:</strong> ${r.News}</p>
                    <div class="comment-section">
                        <h5>Comments:</h5>
                        <ul class="comment-list">${commentsHTML}</ul>
                        <input type="text" class="comment-input" placeholder="Add a comment...">
                        <button class="comment-btn" data-id="${r.id}">Add comment</button>
                    </div>
                    <button class="delete-btn" data-id="${r.id}">Delete new</button>
                </details><br>
            `;
        });
        renderPagination(data.length);
    };

    // Rendering pagination and handling the pagination buttons:
    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / numberOfItemsPerPage);
        pagination.innerHTML = "";
        if (currentPage > 1) {
            pagination.innerHTML += `<a href="#" data-page="${currentPage - 1}"><<</a> `;
        }
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<a href="#" data-page="${i}">${i}</a> `;
        }
        if (currentPage < totalPages) {
            pagination.innerHTML += `<a href="#" data-page="${currentPage + 1}">>></a>`;
        }
        document.querySelectorAll(".pagination a").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.getAttribute("data-page"));
                renderPage(currentPage);
            });
        });
    };

    // Validating the form and ensuring the user can't submit the form without filling in the required fields:
    const form = document.getElementById("addNews");
    const errorDisplay = document.getElementById("form-error");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("title").value.trim();
        const college = document.getElementById("college").value.trim();
        const year = document.getElementById("year").value.trim();
        const author = document.getElementById("author").value.trim();
        const description = document.getElementById("description").value.trim();
        errorDisplay.textContent = "";
        if (!title || !college || !year || !author || !description) {
            errorDisplay.textContent = "Please ensure all fields are filled.";
            return;
        }
        const newNews = { Title: title, College: college, Date: year, Author: author, News: description, comments: [] };
        try {
            const res = await fetch(DB_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newNews)
            });
            if (!res.ok) throw new Error("Unable to add new.");
            const addedNews = await res.json();
            await fetchNews(); 
            alert("The new has been successfully posted!");
            form.reset();
            renderPage(currentPage);
        } catch (err) {
            errorDisplay.textContent = "There was an issue adding the news: " + err.message;
        }
    });

    searchInput.addEventListener("input", () => {
        currentPage = 1;
        renderPage(currentPage);
    });

    sortSelect.addEventListener("change", () => {
        currentPage = 1;
        renderPage(currentPage);
    });

    fetchNews();
});
