const recipeList = document.getElementById('recipeList');
const readRecipeMessage = document.getElementById('readRecipeMessage');
const searchRecipe = document.getElementById('searchRecipe');
const filterCuisine = document.getElementById('filterCuisine');

let allRecipes = [];

// READ - Retrieve and display all recipes
async function displayRecipes() {
    try {
        const response = await fetch('/recipes');

        if (!response.ok) {
            throw new Error('Failed to retrieve recipes');
        }

        const recipes = await response.json();

        allRecipes = recipes;

        recipeList.innerHTML = '';

        if (recipes.length === 0) {
            readRecipeMessage.textContent = 'No recipes found.';
            return;
        }

        readRecipeMessage.textContent = '';

        const filteredRecipes = allRecipes.filter(recipe => {
            const searchText = searchRecipe.value.toLowerCase().trim();
            const selectedCuisine = filterCuisine.value;

            const matchesName = recipe.name.toLowerCase().includes(searchText);
            const matchesCuisine =
                selectedCuisine === 'All' || recipe.category === selectedCuisine;

            return matchesName && matchesCuisine;
        });

        // Display message when no recipes match
        if (filteredRecipes.length === 0) {
            readRecipeMessage.textContent =
                'No recipes found. Try another search or cuisine.';
            return;
        }

        readRecipeMessage.textContent = '';

        filteredRecipes.forEach(recipe => {
            // Create recipe card
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';

            // READ - Display recipe image
            const recipeImage = document.createElement('img');
            recipeImage.className = 'recipe-image';
            recipeImage.src = recipe.image || '/images/placeholder.jpg';
            recipeImage.alt = recipe.name;
            recipeImage.loading = 'lazy';

            // Cuisine badge
            const recipeCategory = document.createElement('span');
            recipeCategory.className = 'recipe-category';
            recipeCategory.textContent = recipe.category;

            // Recipe name
            const recipeName = document.createElement('h3');
            recipeName.textContent = recipe.name;

            // Ingredient count
            const ingredientCount = document.createElement('p');
            ingredientCount.className = 'recipe-info';
            ingredientCount.textContent =
                `${recipe.ingredients.length} ingredient(s)`;

            // View Details button
            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.className = 'view-details-button';
            viewButton.textContent = 'View Details';

            viewButton.addEventListener('click', () => {
                displayRecipeDetails(recipe);
            });

            // UPDATE - Edit button (opens edit.html for this recipe) - JANSEN
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'view-details-button';
            editButton.textContent = 'Edit';

            editButton.addEventListener('click', () => {
                window.location.href = '/edit.html?id=' + recipe.id;
            });

            recipeCard.appendChild(recipeImage);
            recipeCard.appendChild(recipeCategory);
            recipeCard.appendChild(recipeName);
            recipeCard.appendChild(ingredientCount);
            recipeCard.appendChild(viewButton);
            recipeCard.appendChild(editButton);

            recipeList.appendChild(recipeCard);
        });

    } catch (error) {
        readRecipeMessage.textContent = 'Error loading recipes.';
    }
}

// READ - Display individual recipe details
function displayRecipeDetails(recipe) {
    recipeList.innerHTML = '';

    const detailCard = document.createElement('div');
    detailCard.className = 'recipe-detail';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.textContent = '← Back to Recipes';
    backButton.className = 'back-button';

    backButton.addEventListener('click', displayRecipes);

    const recipeName = document.createElement('h2');
    recipeName.textContent = recipe.name;

    const detailImage = document.createElement('img');
    detailImage.className = 'recipe-detail-image';
    detailImage.src = recipe.image || '/images/placeholder.jpg';
    detailImage.alt = recipe.name;

    const category = document.createElement('p');
    category.textContent = `Cuisine: ${recipe.category}`;

    const ingredientsHeading = document.createElement('h3');
    ingredientsHeading.textContent = 'Ingredients';

    const ingredientList = document.createElement('ul');

    recipe.ingredients.forEach(ingredient => {
        const item = document.createElement('li');
        item.textContent =
            `${ingredient.name} - ${ingredient.quantity} ${ingredient.unit}`;
        ingredientList.appendChild(item);
    });

    const instructionsHeading = document.createElement('h3');
    instructionsHeading.textContent = 'Cooking Instructions';

    const instructionList = document.createElement('ol');

    recipe.instructions.forEach(instruction => {
        const item = document.createElement('li');
        item.textContent = instruction;
        instructionList.appendChild(item);
    });

    detailCard.appendChild(backButton);
    detailCard.appendChild(recipeName);
    detailCard.appendChild(detailImage);
    detailCard.appendChild(category);
    detailCard.appendChild(ingredientsHeading);
    detailCard.appendChild(ingredientList);
    detailCard.appendChild(instructionsHeading);
    detailCard.appendChild(instructionList);

    recipeList.appendChild(detailCard);
}

// Load recipes automatically when the webpage opens
displayRecipes();

// SEARCH - Filter recipes by name
searchRecipe.addEventListener('input', () => {
    displayRecipes();
});

// FILTER - Filter recipes by cuisine
filterCuisine.addEventListener('change', () => {
    displayRecipes();
});

// CREATE - Open the add recipe page
const createRecipeButton = document.getElementById('createRecipeButton');

createRecipeButton.addEventListener('click', () => {
    window.location.href = '/index.html';
});