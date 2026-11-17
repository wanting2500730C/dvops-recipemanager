const fs = require('node:fs').promises;
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const recipesFile = path.join(__dirname, 'recipes.json');
const templateFile = path.join(__dirname, 'recipes.template.json');

const cuisines = new Set([
    'Indian', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Other'
]);

let pendingSave = Promise.resolve();

function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

async function saveRecipe(recipe) {
    let fileData;

    try {
        fileData = await fs.readFile(recipesFile, 'utf8');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }

        fileData = await fs.readFile(templateFile, 'utf8');
    }

    const recipes = JSON.parse(fileData);
    recipes.push(recipe);

    // Write the updated list before replacing the current data file.
    const temporaryFile = path.join(__dirname, `recipes-${recipe.id}.tmp`);

    try {
        await fs.writeFile(temporaryFile, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
        await fs.rename(temporaryFile, recipesFile);
    } catch (error) {
        await fs.rm(temporaryFile, { force: true });
        throw error;
    }
}

async function createRecipe(req, res) {
    const { name, category, ingredients, instructions } = req.body ?? {};

    if (!hasText(name)) {
        return res.status(400).json({ message: 'Enter a recipe name.' });
    }

    if (!cuisines.has(category)) {
        return res.status(400).json({ message: 'Select a valid cuisine.' });
    }

    if (
        !Array.isArray(ingredients) ||
        ingredients.length === 0 ||
        ingredients.some((ingredient) =>
            !hasText(ingredient?.name) ||
            !hasText(ingredient?.unit) ||
            !Number.isFinite(ingredient?.quantity) ||
            ingredient.quantity <= 0
        )
    ) {
        return res.status(400).json({
            message: 'Each ingredient needs a name, unit, and quantity greater than 0.'
        });
    }

    if (
        !Array.isArray(instructions) ||
        instructions.length === 0 ||
        instructions.some((step) => !hasText(step))
    ) {
        return res.status(400).json({ message: 'Enter at least one cooking step.' });
    }

    const recipe = {
        id: randomUUID(),
        name: name.trim(),
        category,
        ingredients: ingredients.map((ingredient) => ({
            name: ingredient.name.trim(),
            quantity: ingredient.quantity,
            unit: ingredient.unit.trim()
        })),
        instructions: instructions.map((step) => step.trim())
    };

    // Process Create Recipe saves in order to avoid overwriting another new recipe.
    const save = pendingSave.then(() => saveRecipe(recipe));
    pendingSave = save.catch(() => {});

    try {
        await save;
        return res.status(201).json({
            message: 'Recipe saved successfully.',
            recipe
        });
    } catch (error) {
        console.error('Could not save recipe:', error);
        return res.status(500).json({ message: 'The server could not save the recipe.' });
    }
}

module.exports = { createRecipe };