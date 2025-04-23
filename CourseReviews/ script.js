// 1.fetching from mockAPI + rendering
document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://68063119ca467c15be6b85c3.mockapi.io/reviews";
    const resultsContainer = document.querySelector(".results");
    const pagination = document.querySelector(".pagination_section");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.querySelector("select.sorting");
    const itemsPerPage = 3;
    let currentPage = 1;
    let allReviews = [];
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
// 2. sorting
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
// 3. rendering function
    const renderPage = (page) => {
        const data = getFilteredSortedData();
        const start = (page - 1) * itemsPerPage;
        const paginated = data.slice(start, start + itemsPerPage);

        resultsContainer.innerHTML = "<h3>Reviews:</h3><br>";
        if (!paginated.length) {
            resultsContainer.innerHTML += "<p>No matching reviews.</p>";
            return;
        }
// 4. pagination function to display reviews
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
// to show pagination boxes based on reviews quantity
    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
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
        document.querySelectorAll(".pagination_section a").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.getAttribute("data-page"));
                renderPage(currentPage);
            });
        });
    };

    // 4.form validation
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
        const author = document.querySelector('input[name="author"]:checked');
        errorDisplay.textContent = "";
        if (!course) {
            errorDisplay.textContent = "Please enter the course.";
            return;
        }
        if (!year) {
            errorDisplay.textContent = "Please enter the year.";
            return;
        }
        if (!review) {
            errorDisplay.textContent = "Please enter your review.";
            return;
        }
        if (!author) {
            errorDisplay.textContent = "Please select the author type.";
            return;
        }
/* This is for pushing a review after submission (not required in this phase)
        const newReview = {
            course,
            year,
            review,
            author: author.value,
            id: allReviews.length + 1  
        };
        allReviews.push(newReview);
        renderPage(currentPage);  
*/
        // Trigger confetti effect
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        alert("Review submitted!");
    });

    //adding eventlisteners to start functioning
    searchInput.addEventListener("input", () => {
        currentPage = 1;  
        renderPage(currentPage);
    });
    sortSelect.addEventListener("change", () => {
        currentPage = 1; 
        renderPage(currentPage);
    });
    fetchReviews(); //initial fetch
});