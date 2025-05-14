document.addEventListener("DOMContentLoaded", () => {

    const clubContainer = document.querySelector(".results");
    const searchInput = document.querySelector(".search-filter input[type='text']");
    const sortSelect = document.querySelector(".search-filter select.sorting");
    const pagination = document.querySelector(".paginationing");

    const itemsPerPage = 5;
    let currentPage = 1;
    let allactivities = [];
    let filteredActivities = [];

    //Display messages to users if error or loading
    const showError = (message) => {
        clubContainer.innerHTML = `<p style="color:red;">${message}</p>`;
    };

    const showLoading = () => {
        clubContainer.innerHTML = "<p>Loading activities...</p>";
    };

    // Fetching nescessary information from API
    async function fetchactivities () {
        try {
            showLoading();
            const act = await fetch('https://583092bf-47a6-4ec6-9c68-10f098e6b456-00-68xeoyj963l9.sisko.replit.dev/main.php');
            if (!act.ok) throw new Error("Failed to fetch data.");
            allactivities = await act.json();
            searchActivities();
        } catch (err) {
            showError(err.message);
        }
    };

    // Delete Activity
    clubContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const activityId = e.target.getAttribute("data-id");
            if (!confirm("Are you sure you want to delete this activity?")) return;

            try {
                const res = await fetch(`https://583092bf-47a6-4ec6-9c68-10f098e6b456-00-68xeoyj963l9.sisko.replit.dev/main.php?id=${activityId}`, {
                    method: "DELETE"
                });

                if (!res.ok) throw new Error("Failed to delete activity.");
                allactivities = allactivities.filter(a => a.id != activityId);
                alert("Activity deleted successfully.")
                currentPage = 1;
                searchActivities();
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });

    //Posting comment button:
    clubContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("post-comment-btn")) {
            const activityId = e.target.getAttribute("data-id");
            const input = e.target.closest(".comments-section").querySelector("textarea");
            const commentText = input.value.trim();
            if (!commentText) {
                alert("Comment cannot be empty.");
                return;
            }
            try {
                const res = await fetch('https://583092bf-47a6-4ec6-9c68-10f098e6b456-00-68xeoyj963l9.sisko.replit.dev/main.php', {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: activityId, comment: commentText })
                });
    
                if (!res.ok) throw new Error("Failed to add comment.");
    
                input.value = ""; // Clear input
                alert("Comment added.");
                const commentList = input.closest(".comments-section").querySelector(".existing-comments");
                const newCommentEl = document.createElement("p");
                newCommentEl.style.marginLeft = "1em";
                newCommentEl.textContent = `• ${commentText}`;
                commentList.appendChild(newCommentEl);
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });


    //Handling the edit modal of the activities:
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editAct");
    const cancelEditBtn = document.getElementById("cancelEdit");

    //Openning the dialog:
    clubContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-btn")) {
            editingId = e.target.getAttribute("data-id");
            const activity = allactivities.find(a => a.id == editingId);

            document.getElementById("editClub").value = activity.Club;
            document.getElementById("editActivity").value = activity.Activity;
            document.getElementById("editDate").value = activity.Date;
            document.getElementById("editLocation").value = activity.Location;
            document.getElementById("editDescription").value = activity.Description;

            editModal.showModal();
        }
    });

    // Submit the edit button:
    editForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const updated = {
            id: editingId,
            Club: document.getElementById("editClub").value.trim(),
            Activity: document.getElementById("editActivity").value.trim(),
            Date: document.getElementById("editDate").value.trim(),
            Location: document.getElementById("editLocation").value.trim(),
            Description: document.getElementById("editDescription").value.trim()
        };

        try {
            const res = await fetch("https://583092bf-47a6-4ec6-9c68-10f098e6b456-00-68xeoyj963l9.sisko.replit.dev/main.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });

            if (!res.ok) throw new Error("Failed to update activity.");
            alert("Activity updated.");
            editModal.close();
            await fetchactivities();
        } catch (err) {
            alert("Error: " + err.message);
        }
    });

    //The cacel button for the edit modal:
    cancelEditBtn.addEventListener("click", () => {
        editModal.close();
    });


    // The search function:
    function searchActivities() {
        currentPage = 1;
    
        const searchQ = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value;
    
        filteredActivities = allactivities
            .filter(activity => activity.Club.toLowerCase().includes(searchQ))
            .sort((a, b) => {
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                return sortOrder === "1" ? dateB - dateA : dateA - dateB;
            });
    
        displayActivities(filteredActivities);
    }
    
    // Display function for the result to only show 5 results at a time
    function displayActivities(data) {
        clubContainer.innerHTML = '<h3>Results:</h3>';
    
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const page = data.slice(start, end);
    
        if (!page.length) {
            clubContainer.innerHTML += "<p>No matching activities.</p>";
            return;
        }

        page.forEach(a => {
            const parsedComments = (() => {
                try {
                    const raw = typeof a.comments === "string" ? JSON.parse(a.comments) : a.comments;
                    return Array.isArray(raw) ? raw : [];
                } catch (e) {
                    return [];
                }
            })();
        
            const commentListHTML = parsedComments.map(c => {
                return `<p style="margin-left:1em;">• ${c.data || c.text || "Invalid comment"}</p>`;
            }).join('');
        
            const detail = document.createElement('details');
            detail.innerHTML = `
                <summary>
                    <p><strong>Club: ${a.Club}</strong></p>
                    <p><strong>Activity: ${a.Activity}</strong></p>
                    <p><strong>Date:</strong> ${a.Date}</p>
                </summary>
                <p><strong>Location:</strong> ${a.Location}</p>
                <p><strong>Description:</strong> ${a.Description}</p>
                <hr>
                <div class="comments-section" data-activity-id="${a.id}">
                    <h5>Comments</h5>
                    <div class="existing-comments">
                        ${commentListHTML}
                    </div>
                    <textarea placeholder="Leave a comment..." rows="3"></textarea><br>
                    <button class="post-comment-btn" data-id="${a.id}">Post Comment</button>
                </div>
                <hr>
                <button class="edit-btn" data-id="${a.id}">Edit</button>
                <button class="delete-btn" data-id="${a.id}" style="color: red;">Delete</button>
            `;
            clubContainer.appendChild(detail);
        });
        

        renderPagination(data.length);
    }

    function renderPagination(totalItems) {
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

        document.querySelectorAll(".paginationing a").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.getAttribute("data-page"));
                displayActivities(filteredActivities);
            });
        });
    };

    //Form validation: 
        const form = document.querySelector("#addActForm");
        const errorDisplay = document.getElementById("form-error");
    
        form.addEventListener('submit', async function(e) {
            e.preventDefault();


            const titleInput = document.getElementById("title");
            const dateInput = document.getElementById("date");
            const locationInput = document.getElementById("location");
            const descriptionInput = document.getElementById("description");

            const club = document.querySelector("input[name='club']:checked")?.value || "";
            const title = titleInput.value.trim();
            const date = dateInput.value.trim();
            const location = locationInput.value.trim();
            const description = descriptionInput.value.trim();
            errorDisplay.textContent = "" ; 

            // Check if all values are filled
            if (!club || !title || !date || !location || !description) {
                errorDisplay.textContent = "All fields are required.";
                return;
            }

            const newAct= { Club: club, Activity: title, Date: date, Location: location, Description: description};

            try{
                const res = await fetch("https://583092bf-47a6-4ec6-9c68-10f098e6b456-00-68xeoyj963l9.sisko.replit.dev/addAct.php", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newAct)
                    });
                    if (!res.ok) {
                        const errorData = await res.json(); // Read the error response
                        throw new Error(`Failed to add Activity: ${errorData.error || res.statusText}`);
                    }
                    const addedAct = await res.json();
                    await fetchactivities();
                    //allactivities.push(addedAct);
                    alert("Activities added successfully!");
                    currentPage = 1;
                    searchActivities();
                    form.reset();
                    displayActivities(filteredActivities);
                }
            catch(err) {
                errorDisplay.textContent = "Error adding Activity: " + err.message;
            }
        });

        searchInput.addEventListener("input", () => {
            currentPage = 1;  // Reset to page 1 whenever search input changes
            searchActivities();
        });
    
        sortSelect.addEventListener("change", () => {
            currentPage = 1;
            searchActivities();
        });
    
    fetchactivities(); // initial fetch
});