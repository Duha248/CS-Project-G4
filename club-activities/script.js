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
            const act = await fetch('https://68073717e81df7060eb936b9.mockapi.io/acivities');
            if (!act.ok) throw new Error("Failed to fetch data.");
            allactivities = await act.json();
            searchActivities();
        } catch (err) {
            showError(err.message);
        }
    };

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
            const detail = document.createElement('details');
            detail.innerHTML = `
                <summary>
                    <p><strong>Club: ${a.Club}</strong></p>
                    <p><strong>Activity: ${a.Activity}</strong></p>
                    <p><strong>Date:</strong> ${a.Date}</p>
                </summary>
                <p><strong>Location:</strong> ${a.Location}</p>
                <p><strong>Description:</strong> ${a.Description}</p>
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
        const form = document.querySelector("form");
        const titleInput = document.getElementById("title");
        const dateInput = document.getElementById("date");
        const locationInput = document.getElementById("location");
        const descriptionInput = document.getElementById("description");
        const errorDisplay = document.getElementById("form-error");
    
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const clubInput = document.querySelector("input[name='club']:checked");
            const title = titleInput.value.trim();
            const date = dateInput.value.trim();
            const location = locationInput.value.trim();
            const description = descriptionInput.value.trim();
            errorDisplay.textContent = "" ; 

            // Check if all values are filled
            if (!clubInput) {
                errorDisplay.textContent = "Please select a club.";
                return;
            }
            if (!title) {
                errorDisplay.textContent = "Please enter a title.";
                //alert ("Please enter the activity title.");
                return;
            }
            if (!date) {
                errorDisplay.textContent = "Please select a date.";
                //alert ("Please enter the date.");
                return;
            }
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                errorDisplay = "Please enter a valid date.";
                return;
            }
            if (!location) {
                errorDisplay.textContent = "Please enter a location.";
                //alert ("Please enter the location.");
                return;
            }
            if (!description) {
                errorDisplay.textContent = "Please enter a desc.";
                //alert("Please enter the description.");
                return;
            }
/*
            // Adding activity to the API
            const newAct = {
                club , title , date ,
                location , description , 
                id: allactivities.length + 1
            }
            filteredActivities.push(newAct);
            searchActivities();
*/          
          

            // Success action - shows alert and resets form
            alert("Activity added successfully!");
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

