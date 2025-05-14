document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://a0f96f78-3d32-4f9d-bbf1-d608077d5ba1-00-2yzixh0ocnitb.pike.replit.dev/student-marketplace.php";
  
    const itemsList = document.getElementById("items-list");
    const addItemForm = document.getElementById("add-item-form");
    const searchInput = document.getElementById("item-search");
    const conditionFilter = document.getElementById("item-condition-filter");
    const sortBy = document.getElementById("sort-by");
    const prevBtn = document.getElementById("prev-item");
    const nextBtn = document.getElementById("next-item");
    const findItemBtn = document.getElementById("find-item-btn");
  
    let items = [];
    let filteredItems = [];
    let currentPage = 0;
    const itemsPerPage = 1;
  
    function showLoading() {
      itemsList.innerHTML = "<p>Loading items...</p>";
    }
  
    function showError(message) {
      itemsList.innerHTML = `<p style="color:red;">${message}</p>`;
    }
  
    function fetchItems() {
        showLoading();
        fetch(API_URL)
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            items = data.map((item, index) => ({
              title: item.title || `Item ${index + 1}`,
              description: item.description || "No description provided.",
              condition: item.condition || "used",
              price: parseFloat(item.price) || 0,
              contact: item.contact || "N/A"
            }));
            applyFilters();
          })
          .catch(error => {
            console.error(error);
            showError("Failed to load items. Please try again later.");
          });
    }
  
    function applyFilters() {
      const conditionValue = conditionFilter.value.toLowerCase();
      const searchValue = searchInput.value.toLowerCase();
  
      filteredItems = items.filter(item => {
        const matchesCondition = !conditionValue || item.condition === conditionValue;
        const matchesSearch = item.title.toLowerCase().includes(searchValue) || item.description.toLowerCase().includes(searchValue);
        return matchesCondition && matchesSearch;
      });
  
      const sortValue = sortBy.value;
      if (sortValue === "low") {
        filteredItems.sort((a, b) => a.price - b.price);
      } else if (sortValue === "high") {
        filteredItems.sort((a, b) => b.price - a.price);
      }
  
      currentPage = 0;
      renderPage();
    }
  
    function renderPage() {
      if (filteredItems.length === 0) {
        itemsList.innerHTML = "<p>No items to display.</p>";
        return;
      }
  
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageItems = filteredItems.slice(startIndex, endIndex);
  
      itemsList.innerHTML = pageItems.map(item => `
        <div class="item-card animated-card">
          <h3>${item.title}</h3>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Condition:</strong> ${item.condition}</p>
          <p><strong>Price:</strong> ${item.price} BD</p>
          <p><strong>Contact:</strong> ${item.contact}</p>
          <a href="item-details.html?index=${items.indexOf(item)}" class="animated-button">View Details</a>
        </div>
      `).join("");
    }

    function validateFormInput() {
      let isValid = true;
      const title = document.getElementById("item-title");
      const desc = document.getElementById("item-description");
      const condition = document.getElementById("item-condition");
      const price = document.getElementById("item-price");
      const contact = document.getElementById("item-contact");
  
      if (!title.value.trim()) {
        alert("Title is required.");
        isValid = false;
      }
      if (!desc.value.trim()) {
        alert("Description is required.");
        isValid = false;
      }
      if (!condition.value) {
        alert("Please select a condition.");
        isValid = false;
      }
      if (!price.value || price.value <= 0) {
        alert("Please enter a valid price.");
        isValid = false;
      }
      if (!contact.value.trim()) {
        alert("Contact number is required.");
        isValid = false;
      }
  
      return isValid;
    }
  
    addItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Validate input before sending data
        if (!validateFormInput()) return;
      
        const newItem = {
          title: document.getElementById("item-title").value,
          description: document.getElementById("item-description").value,
          condition: document.getElementById("item-condition").value,
          price: parseFloat(document.getElementById("item-price").value),
          contact: document.getElementById("item-contact").value
        };
      
        // Send data to the server via POST request
        fetch(API_URL + "?type=item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem)
        })
        .then(response => response.json())
        .then(data => {
          alert(data.message);  // Show success message from backend
          fetchItems(); // Refresh the items list after adding
        })
        .catch(error => {
          console.error("Error adding item:", error);
          alert("Error adding item.");
        });
      });
      
  
    findItemBtn.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilters();
    });
  
    conditionFilter.addEventListener("change", applyFilters);
    sortBy.addEventListener("change", applyFilters);
  
    prevBtn.addEventListener("click", () => {
      if (currentPage > 0) {
        currentPage--;
        renderPage();
      }
    });
  
    nextBtn.addEventListener("click", () => {
      if ((currentPage + 1) * itemsPerPage < filteredItems.length) {
        currentPage++;
        renderPage();
      }
    });
  
    fetchItems();
});
