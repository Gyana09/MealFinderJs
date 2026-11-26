const API = "https://www.themealdb.com/api/json/v1/1/";
const params = new URLSearchParams(window.location.search);

let page = document.body.getAttribute("data-page");
if (page === "category") {
    if (params.get("id")) {
        page = "meal";
    } else if (params.has("q")) {
        page = "search";
    }
}

async function getData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Cannot connect to the API");
    }

    const data = await response.json();
    return data;
}

function setupSearch() {
    const form = document.getElementById("searchForm");
    const input = form.querySelector("input");

    if (page === "search") {
        input.value = params.get("q") || "";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const foodName = input.value.trim();
        if (foodName === "") {
            alert("Please enter a meal name.");
            return;
        }

        window.location.href = "category.html?q=" + encodeURIComponent(foodName);
    });
}

async function loadCategories() {
    try {
        const data = await getData(API + "categories.php");
        const categories = data.categories;
        if (!categories) {
            throw new Error("No categories found");
        }

        const menu = document.getElementById("navCategoryList");
        menu.textContent = "";

        for (const category of categories) {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.textContent = category.strCategory;
            link.href = "category.html?category=" + encodeURIComponent(category.strCategory);
            item.appendChild(link);
            menu.appendChild(item);
        }

        if (page === "home") {
            showCategories(categories);
        }

        if (page === "category" || page === "vegetarian") {
            const categoryName = getCategoryName();
            for (const category of categories) {
                if (category.strCategory.toLowerCase() === categoryName.toLowerCase()) {
                    document.getElementById("descriptionText").textContent = category.strCategoryDescription || "";
                    break;
                }
            }
        }
    } catch (error) {
        console.error(error);
        if (page === "home") {
            document.getElementById("categoryStatus").textContent = "Could not load categories. Please refresh the page.";
        }
    }
}

function showCategories(categories) {
    const grid = document.getElementById("categoryGrid");
    const template = document.getElementById("categoryCardTemplate");
    grid.textContent = "";

    for (const category of categories) {
        const card = template.content.cloneNode(true);
        const link = card.querySelector(".category-card");
        const label = card.querySelector(".category-badge");
        const image = card.querySelector("img");

        link.href = "category.html?category=" + encodeURIComponent(category.strCategory);
        label.textContent = category.strCategory.toUpperCase();
        image.src = category.strCategoryThumb || "../assets/" + category.strCategory.toLowerCase() + ".png";
        image.alt = category.strCategory;

        grid.appendChild(card);
    }

    document.getElementById("categoryStatus").textContent = "";
}

function getCategoryName() {
    if (page === "vegetarian") {
        return "Vegetarian";
    }
    return params.get("category") || "";
}

async function loadMeals() {
    const title = document.getElementById("resultsTitle");
    const status = document.getElementById("resultsStatus");
    const searchText = (params.get("q") || "").trim();
    const categoryName = getCategoryName();
    let url = "";
    let label = "";

    if (page === "search") {
        title.textContent = "SEARCH RESULTS FOR " + searchText.toUpperCase();
        if (searchText === "") {
            status.textContent = "Please type a meal name in the search box.";
            return;
        }
        url = API + "search.php?s=" + encodeURIComponent(searchText);
    } else {
        title.textContent = categoryName.toUpperCase() + " MEALS";
        if (categoryName === "") {
            status.textContent = "Please choose a category on the home page.";
            return;
        }

        label = categoryName;
        document.getElementById("categoryDescription").hidden = false;
        document.getElementById("descriptionTitle").textContent = categoryName;
        document.getElementById("descriptionText").textContent = "Explore " + categoryName + " recipes.";
        url = API + "filter.php?c=" + encodeURIComponent(categoryName);
    }

    status.textContent = "Loading recipes...";

    try {
        const data = await getData(url);
        showMeals(data.meals, label);
    } catch (error) {
        console.error(error);
        status.textContent = "Could not load recipes. Please refresh the page.";
    }
}

function showMeals(meals, categoryName) {
    const grid = document.getElementById("recipeGrid");
    const template = document.getElementById("recipeCardTemplate");
    const status = document.getElementById("resultsStatus");
    grid.textContent = "";

    if (!meals || meals.length === 0) {
        status.textContent = "No meals found. Try another search or category.";
        return;
    }

    for (const meal of meals) {
        const card = template.content.cloneNode(true);
        const link = card.querySelector(".recipe-card");
        const image = card.querySelector("img");
        const origin = card.querySelector(".recipe-origin");
        const title = card.querySelector(".recipe-title");

        link.href = "category.html?id=" + encodeURIComponent(meal.idMeal);
        image.src = meal.strMealThumb;
        image.alt = meal.strMeal;
        origin.textContent = meal.strArea || categoryName || "Recipe";
        title.textContent = meal.strMeal;

        grid.appendChild(card);
    }

    status.textContent = "";
}

async function loadMealDetails() {
    const id = params.get("id");
    const status = document.getElementById("mealStatus");

    try {
        if (!id) {
            status.textContent = "Please choose a recipe first.";
            return;
        }

        const data = await getData(API + "lookup.php?i=" + encodeURIComponent(id));
        if (!data.meals || data.meals.length === 0) {
            status.textContent = "Recipe not found.";
            return;
        }

        showMealDetails(data.meals[0]);
        document.getElementById("mealContent").hidden = false;
        status.textContent = "";
    } catch (error) {
        console.error(error);
        status.textContent = "Could not load this recipe. Please refresh the page.";
    }
}

function showMealDetails(meal) {
    document.title = meal.strMeal + " | Meal Finder";
    document.getElementById("mealBreadcrumb").textContent = meal.strMeal.toUpperCase();
    document.getElementById("detailTitle").textContent = meal.strMeal;
    document.getElementById("detailImage").src = meal.strMealThumb;
    document.getElementById("detailImage").alt = meal.strMeal;

    const category = document.getElementById("detailCategory");
    category.textContent = meal.strCategory || "Uncategorized";
    category.href = "category.html?category=" + encodeURIComponent(meal.strCategory || "Miscellaneous");

    const cuisine = document.getElementById("detailArea");
    if (cuisine && cuisine.parentElement) {
        cuisine.parentElement.hidden = true;
    }

    const videoRow = document.getElementById("videoRow");
    if (videoRow) {
        videoRow.hidden = true;
    }

    const sourceRow = document.getElementById("sourceRow");
    const sourceLink = document.getElementById("detailSource");
    sourceRow.hidden = true;

    if (meal.strSource && (meal.strSource.startsWith("https://") || meal.strSource.startsWith("http://"))) {
        sourceRow.hidden = false;
        sourceLink.href = meal.strSource;
        sourceLink.textContent = meal.strSource;
    }

    const tagsBox = document.getElementById("detailTags");

    tagsBox.innerHTML = "";

    const label = document.createElement("strong");
    label.textContent = "Tags: ";
    tagsBox.appendChild(label);

    if (meal.strTags) {
        const tags = meal.strTags.split(",");

        for (let i = 0; i < tags.length; i++) {
            const tag = document.createElement("span");
            tag.textContent = tags[i].trim();

            tagsBox.appendChild(tag);
        }
    } else {
        const message = document.createElement("p");
        message.textContent = "No tags available";
        tagsBox.appendChild(message);
    }


    const ingredientList = document.getElementById("detailIngredients");
    const measureList = document.getElementById("detailMeasures");
    const ingredientTemplate = document.getElementById("ingredientTemplate");
    const measureTemplate = document.getElementById("measureTemplate");
    let count = 1;

    for (let i = 1; i <= 20; i++) {
        const ingredient = (meal["strIngredient" + i] || "").trim();
        const measure = (meal["strMeasure" + i] || "").trim();

        if (ingredient !== "") {
            const ingredientRow = ingredientTemplate.content.cloneNode(true);
            ingredientRow.querySelector(".ingredient-number").textContent = count;
            ingredientRow.querySelector(".ingredient-name").textContent = ingredient;
            ingredientList.appendChild(ingredientRow);

            const measureRow = measureTemplate.content.cloneNode(true);
            measureRow.querySelector(".measure-text").textContent = ingredient + ": " + (measure || "To taste");
            measureList.appendChild(measureRow);
            count++;
        }
    }

    const instructions = meal.strInstructions || "No instructions available.";
    const steps = instructions.split(/\r?\n+/);
    const instructionsList = document.getElementById("detailInstructions");
    const instructionTemplate = document.getElementById("instructionTemplate");

    for (const step of steps) {
        if (step.trim() !== "") {
            const row = instructionTemplate.content.cloneNode(true);
            row.querySelector(".step-text").textContent = step.trim();
            instructionsList.appendChild(row);
        }
    }
}

function showView() {
    const results = document.getElementById("resultsSection");
    const details = document.getElementById("mealDetails");
    if (!results || !details) {
        return;
    }
    results.hidden = (page === "meal");
    details.hidden = (page !== "meal");
}

showView();
setupSearch();

if (page === "category" || page === "vegetarian" || page === "search") {
    loadMeals();
}

if (page === "meal") {
    loadMealDetails();
}


loadCategories();
