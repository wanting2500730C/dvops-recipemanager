const fs = require('fs').promises;
const path = require('path');

const filePath = path.join(__dirname, 'recipes.json');

// READ - Get all recipes
async function readRecipes(req, res) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const recipes = JSON.parse(data);

        if (!Array.isArray(recipes)) {
            return res.status(500).json({
                message: 'Invalid recipe data format'
            });
        }

        return res.status(200).json(recipes);

    } catch (error) {
        return res.status(500).json({
            message: 'Error retrieving recipes'
        });
    }
}

// READ - Get recipe by ID
async function readRecipeById(req, res) {
    const recipeId = req.params.id;

    // Validate UUID format
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(recipeId)) {
        return res.status(400).json({
            message: 'Invalid recipe ID format'
        });
    }

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const recipes = JSON.parse(data);

        if (!Array.isArray(recipes)) {
            return res.status(500).json({
                message: 'Invalid recipe data format'
            });
        }

        const recipe = recipes.find(
            recipe => recipe.id === recipeId
        );

        if (!recipe) {
            return res.status(404).json({
                message: 'Recipe not found'
            });
        }

        return res.status(200).json(recipe);

    } catch (error) {
        return res.status(500).json({
            message: 'Error retrieving recipe'
        });
    }
}

module.exports = {
    readRecipes,
    readRecipeById
};
