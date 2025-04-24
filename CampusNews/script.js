document.addEventListener("DOMContentLoaded", () => {
    
    const API_URL = "https://68073714e81df7060eb936a6.mockapi.io/news";
    const newsContainer = document.querySelector(".news");
    const pagination = document.querySelector(".pagination");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.querySelector("select.sorting");
    const itemsPerPage = 4;
    let currentPage = 1;
    let allNews = [];

    // ========== Fetching & Rendering ==========
    const showLoading = () => {
        newsContainer.innerHTML = `"<p>Loading news...</p>"`;
    };

    const showError = (message) => {
        newsContainer.innerHTML = `<p style="color:red;">${message}</p>`;
    };

    const fetchNews = async () => {
        try {
            showLoading();
            const ne = await fetch(API_URL);
            if (!ne.ok) throw new Error("Failed to fetch data.");
            allNews = await ne.json();
            renderPage(currentPage);
        } catch (err) {
            showError(err.message);
        }
    };

    const getFilteredSortedData = () => {
        let filtered = [...allNews];
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(n => n.College.toLowerCase().includes(searchQuery));
        }
        const sortValue = sortSelect.value;
        filtered.sort((a, b) => sortValue === "2"
        ? a.Date.localeCompare(b.Date)
        : b.Date.localeCompare(a.Date)
    );
        
        
        return filtered;
    };

    const renderPage = (page) => {
        const data = getFilteredSortedData();
        const start = (page - 1) * itemsPerPage;
        const paginated = data.slice(start, start + itemsPerPage);

        newsContainer.innerHTML = "<h3>News:</h3><br>";
        if (!paginated.length) {
            newsContainer.innerHTML += "<p>No matching news.</p>";
            return;
        }

        paginated.forEach(n => {
            newsContainer.innerHTML += `
                <details>
                    <summary>
                        <p><strong>News Title: ${n.Title}</strong></p> 
                        <p><strong>College: ${n.College}</strong></p> 
                        <p><strong>Year: ${n.Date}</strong></p> 
                    </summary>
                    <p><strong>Author:</strong> ${n.Author}</p>
                    <p><strong>News Description:</strong> ${n.News}</p>
                </details><br>
            `;
        });

        renderPagination(data.length);
    };

    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        pagination.innerHTML = "";

        // "Previous" button
        if (currentPage > 1) {
            pagination.innerHTML += `<a href="#" data-page="${currentPage - 1}"><<</a> `;
        }

        // Page links
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<a href="#" data-page="${i}">${i}</a> `;
        }

        // "Next" button
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

    // ========== Form Validation and Adding Review ==========
    const form = document.getElementById("addNews");
    const titleInput = document.getElementById("title");
    const collegeInput = document.getElementById("college");
    const yearInput = document.getElementById("year");
    const authorInput = document.getElementById("author");
    const descriptionInput = document.getElementById("description");
    const errorDisplay = document.getElementById("form-error");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const college = collegeInput.value.trim();
        const year = yearInput.value.trim();
        const author = authorInput.value.trim();
        const description = descriptionInput.value.trim();


        errorDisplay.textContent = "";

        if (!title) {
            errorDisplay.textContent = "Please enter a title.";
            return;
        }

        if (!college) {
            errorDisplay.textContent = "Please enter a college.";
            return;
        }

        if (!year) {
            errorDisplay.textContent = "Please enter a year.";
            return;
        }

        if (!author) {
            errorDisplay.textContent = "Please enter your name.";
            return;
        }

        if (!description) {
            errorDisplay.textContent = "Please select news description.";
            return;
        }
/*
        // After the form passes validation, you can add the review to the mockAPI
        const newReview = {
            course,
            year,
            review,
            author: author.value,
            id: allReviews.length + 1  // Assuming ID will be auto-generated on the API
        };

        // This simulates adding the review to your backend (mock API)
        allReviews.push(newReview);
        renderPage(currentPage);  // Re-render the current page with the new review
*/

        console.log("All validation passed!");
        alert("News submitted!");


    });

    // ========== Event Listeners ==========
    searchInput.addEventListener("input", () => {
        currentPage = 1;  // Reset to page 1 whenever search input changes
        renderPage(currentPage);
    });

    sortSelect.addEventListener("change", () => {
        currentPage = 1;  // Reset to page 1 whenever sorting changes
        renderPage(currentPage);
    });

    fetchNews(); // initial fetch
});