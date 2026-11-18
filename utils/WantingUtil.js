const fs = require('fs').promises;
const path = require('path');

const filePath = path.join(__dirname, 'recipes.json');

// READ - Get all recipes
async function readRecipes(req, res) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const recipes = JSON.parse(data);

        res.status(200).json(recipes);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving recipes'
        });
    }
}

// READ - Get recipe by ID
async function readRecipeById(req, res) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const recipes = JSON.parse(data);

        const recipe = recipes.find(
            recipe => recipe.id === req.params.id
        );

        if (!recipe) {
            return res.status(404).json({
                message: 'Recipe not found'
            });
        }

        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving recipe'
        });
    }
}

module.exports = {
    readRecipes,
    readRecipeById
};
