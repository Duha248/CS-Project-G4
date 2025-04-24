document.addEventListener("DOMContentLoaded", () => {
    
    const API_URL = "https://68063119ca467c15be6b85c3.mockapi.io/reviews";
    const resultsContainer = document.querySelector(".results");
    const pagination = document.querySelector(".pagination_section");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.querySelector("select.sorting");
    const itemsPerPage = 3;
    let currentPage = 1;
    let allReviews = [];

    // ========== Fetching & Rendering ==========
    const showLoading = () => {
        resultsContainer.innerHTML = "<p>Loading reviews...</p>";
    };

    const showError = (message) => {
        resultsContainer.innerHTML = `<p style="color:red;">${message}</p>`;
    };

    const fetchReviews = async () => {
        try {
            showLoading();
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Failed to fetch data.");
            allReviews = await res.json();
            renderPage(currentPage);
        } catch (err) {
            showError(err.message);
        }
    };

    const getFilteredSortedData = () => {
        let filtered = [...allReviews];
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(r => r.course.toLowerCase().includes(searchQuery));
        }
        const sortValue = sortSelect.value;
        filtered.sort((a, b) => sortValue === "1"
            ? a.year.localeCompare(b.year)
            : b.year.localeCompare(a.year)
        );
        return filtered;
    };

    const renderPage = (page) => {
        const data = getFilteredSortedData();
        const start = (page - 1) * itemsPerPage;
        const paginated = data.slice(start, start + itemsPerPage);

        resultsContainer.innerHTML = "<h3>Reviews:</h3><br>";
        if (!paginated.length) {
            resultsContainer.innerHTML += "<p>No matching reviews.</p>";
            return;
        }

        paginated.forEach(r => {
            resultsContainer.innerHTML += `
                <details>
                    <summary>
                        <p><strong>Course: ${r.course}</strong></p> 
                        <p><strong>Year: ${r.year}</strong></p> 
                    </summary>
                    <p><strong>Author:</strong> ${r.author}</p>
                    <p><strong>Review:</strong> ${r.review}</p>
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

        document.querySelectorAll(".pagination_section a").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.getAttribute("data-page"));
                renderPage(currentPage);
            });
        });
    };

    // ========== Form Validation and Adding Review ==========
    const form = document.getElementById("addReview");
    const courseInput = document.getElementById("course");
    const yearInput = document.getElementById("year");
    const reviewInput = document.getElementById("review");
    const errorDisplay = document.getElementById("form-error");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const course = courseInput.value.trim();
        const year = yearInput.value.trim();
        const review = reviewInput.value.trim();
        const author = document.getElementById("author");

        errorDisplay.textContent = "";
        if (!course) {
            errorDisplay.textContent = "Please enter a course.";
            return;
        }

        if (!year) {
            errorDisplay.textContent = "Please enter a year.";
            return;
        }

        if (!review) {
            errorDisplay.textContent = "Please enter your review.";
            return;
        }

        if (!author) {
            errorDisplay.textContent = "Please enter your name.";
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
        // Trigger confetti effect
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        alert("Review submitted!");
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

    fetchReviews(); // initial fetch
});