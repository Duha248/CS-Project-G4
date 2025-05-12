document.addEventListener("DOMContentLoaded", () => {
    const API_URL ="https://c879bd0d-6fe4-4890-88d5-aa3c0a039fff-00-1f7uarqcuicd5.pike.replit.dev/main.php" ;
    const resultsContainer = document.querySelector(".results");
    const pagination = document.querySelector(".pagination_section");
    const searchInput = document.querySelector("input[type='text']");
    const sortSelect = document.querySelector("select.sorting");
    const itemsPerPage = 3;
    let currentPage = 1;
    let allReviews = [];

    // fetch and render method
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

    // delete review method
    resultsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const reviewId = e.target.getAttribute("data-id");
            if (!confirm("Are you sure you want to delete this review?")) return;

            try {
                const res = await fetch(`${API_URL}?id=${reviewId}`, {
                    method: "DELETE"
                });

                if (!res.ok) throw new Error("Failed to delete review.");
                allReviews = allReviews.filter(r => r.id != reviewId);
                alert("Review deleted successfully.");
                renderPage(currentPage);
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });
    // add  new comment method
    resultsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("comment-btn")) {
            const reviewId = e.target.getAttribute("data-id");
            const input = e.target.previousElementSibling;
            const commentText = input.value.trim();
            if (!commentText) {
                alert("Comment cannot be empty.");
                return;
            }
    
            try {
                const res = await fetch(API_URL, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: reviewId, comment: commentText })
                });
    
                if (!res.ok) throw new Error("Failed to add comment.");
    
                input.value = ""; 
                alert("Comment added.");
                fetchReviews();
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });
    
    // filter and sort method (based on user selection- filter by course, sort by date)
    const getFilteredSortedData = () => {
        let filtered = [...allReviews];
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(r => r.course.toLowerCase().includes(searchQuery));
        }
        const sortValue = sortSelect.value;
        filtered.sort((a, b) => {
            const yearA = a.year || "";
            const yearB = b.year || "";
            return sortValue === "1"
                ? yearA.localeCompare(yearB)
                : yearB.localeCompare(yearA);
        });

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
    //displaying review and pagination (based on reviews count, each pagination page has 3 reviews records)
        paginated.forEach(r => {
            const commentsHTML = Array.isArray(r.comments) ? 
            r.comments.map(c => `<li>${c}</li>`).join("")
            : "";

        
            resultsContainer.innerHTML += `
                <details>
                    <summary>
                        <p><strong>Course: ${r.course}</strong></p> 
                        <p><strong>Year: ${r.year}</strong></p> 
                    </summary>
                    <p><strong>Author:</strong> ${r.author}</p>
                    <p><strong>Review:</strong> ${r.review}</p>
                    <div class="comment-section">
                        <h5>Comments:</h5>
                        <ul class="comment-list">${commentsHTML}</ul>
                        <input type="text" class="comment-input" placeholder="Add a comment...">
                        <button class="comment-btn" data-id="${r.id}">Add comment</button>
                    </div>
                    <button class="delete-btn" data-id="${r.id}">Delete review</button>
                </details><br>
            `;
        });
        renderPagination(data.length);
    };
    //display pagination
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

    // form validation (does not accept any empty fields)
    const form = document.getElementById("addReview");
    const errorDisplay = document.getElementById("form-error");


    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const course = document.getElementById("course").value.trim();
        const year = document.getElementById("year").value.trim();
        const review = document.getElementById("review").value.trim();
        const author = document.getElementById("author").value.trim();
    
        errorDisplay.textContent = "";
        if (!course || !year || !review || !author) {
            errorDisplay.textContent = "All fields are required.";
            return;
        }
    
        const newReview = { course: course, year: year, review: review, author: author, comments: [] };
    
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReview)
            });
            console.log(res);
            if (!res.ok) throw new Error("Failed to add review.");
            
            const addedReview = await res.json();
           await fetchReviews();
            alert("Review added successfully!");
            form.reset();
            console.log("before rendre");// used to debug
            renderPage(currentPage); 
            console.log("after rendering"); // used to debug
        } catch (err) {
            errorDisplay.textContent = "Error adding review: " + err.message;
        }
    });
    

    // activate event listeners
    searchInput.addEventListener("input", () => {
        currentPage = 1;  
        renderPage(currentPage);
    });

    sortSelect.addEventListener("change", () => {
        currentPage = 1;  
        renderPage(currentPage);
    });
    fetchReviews(); 
});
