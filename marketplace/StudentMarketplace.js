document.addEventListener("DOMContentLoaded", function () {
    const addItemForm = document.getElementById("add-item-form");
    const itemsList = document.getElementById("items-list");

    const searchInput = document.getElementById("item-search");
    const conditionFilter = document.getElementById("item-condition-filter");
    const sortBy = document.getElementById("sort-by");

    const prevBtn = document.getElementById("prev-item");
    const nextBtn = document.getElementById("next-item");

    let items = [
        {
            title: "Python Programming Book",
            description: "A book that explains the basics of Python programming.",
            condition: "new",
            price: 50,
            contact: "05xxxxxxxx"
        }
    ];

    let currentIndex = 0;

    function getFilteredItems() {
        const conditionValue = conditionFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
    
        let filtered = items.filter(item => {
            const matchesCondition = !conditionValue || item.condition === conditionValue;
            const matchesSearch =
                item.title.toLowerCase().includes(searchValue) ||
                item.description.toLowerCase().includes(searchValue);
    
            return matchesCondition && matchesSearch;
        });
    
        const sortValue = sortBy.value;
        if (sortValue === "low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortValue === "high") {
            filtered.sort((a, b) => b.price - a.price);
        }
    
        return filtered;
    }
    function renderSingleItem() {
        const filteredItems = getFilteredItems();
        if (filteredItems.length === 0) {
            itemsList.innerHTML = "<p>No items to display.</p>";
            return;
        }
    
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex >= filteredItems.length) currentIndex = filteredItems.length - 1;
    
        const item = filteredItems[currentIndex];
    
        itemsList.innerHTML = `
            <div class="item-card animated-card">
                <h3>${item.title}</h3>
                <p><strong>Description:</strong> ${item.description}</p>
                <p><strong>Condition:</strong> ${item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}</p>
                <p><strong>Price:</strong> ${item.price} BD</p>
                <p><strong>Contact:</strong> ${item.contact}</p>
            </div>
        `;
    }

    addItemForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const newItem = {
            title: document.getElementById("item-title").value,
            description: document.getElementById("item-description").value,
            condition: document.getElementById("item-condition").value,
            price: parseFloat(document.getElementById("item-price").value),
            contact: document.getElementById("item-contact").value
        };

        items.push(newItem);
        addItemForm.reset();
        currentIndex = items.length - 1;
        renderSingleItem();
        alert("Item added successfully")
    });

    conditionFilter.addEventListener("change", () => {
        currentIndex = 0;
        renderSingleItem();
    });

    sortBy.addEventListener("change", () => {
        currentIndex = 0;
        renderSingleItem();
    });

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            currentIndex--;
            renderSingleItem();
        });

        nextBtn.addEventListener("click", () => {
            currentIndex++;
            renderSingleItem();
        });
    }

    const findItemBtn = document.getElementById("find-item-btn");

    findItemBtn.addEventListener("click", () => {
        currentIndex = 0;
        renderSingleItem();
    });
});