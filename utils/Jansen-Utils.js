const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, 'recipes.json');

// PUT /update-recipe/:id
function updateRecipe(req, res) {
    try {
        const text = fs.readFileSync(filePath, 'utf8');
        const recipes = JSON.parse(text);

        const idToUpdate = req.params.id;
        const recipe = recipes.find((item) => String(item.id) === idToUpdate);

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const {
            name,
            category = recipe.category,
            ingredients,
            instructions
        } = req.body;

        recipe.name = name;
        recipe.category = category;
        recipe.ingredients = ingredients;
        recipe.instructions = instructions;

        fs.writeFileSync(filePath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');

        return res.json({ message: 'Recipe updated', recipe });
    } catch (error) {
        console.error('Could not update recipe:', error);
        return res.status(500).json({ message: 'Could not update the recipe' });
    }
}

module.exports = { updateRecipe };