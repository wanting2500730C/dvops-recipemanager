const fs = require('node:fs').promises;
const path = require('node:path');

const recipesFile = path.join(__dirname, 'recipes.json');
const publicFolder = path.join(__dirname, '..', 'public');

// DELETE /delete-recipe/:id
async function deleteRecipe(req, res) {
    try {
        let recipes;

        try {
            recipes = JSON.parse(await fs.readFile(recipesFile, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ message: 'Recipe not found.' });
            }
            throw error;
        }

        const index = recipes.findIndex(recipe => recipe.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Recipe not found.' });
        }

        const [deleted] = recipes.splice(index, 1);

        const temporaryFile = path.join(__dirname, `recipes-delete-${deleted.id}.tmp`);

        try {
            await fs.writeFile(temporaryFile, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
            await fs.rename(temporaryFile, recipesFile);
        } catch (error) {
            await fs.rm(temporaryFile, { force: true }).catch(console.error);
            throw error;
        }

        // Remove the recipe's photo, if it has one
        if (deleted.image) {
            await fs.rm(path.join(publicFolder, deleted.image), { force: true })
                .catch(console.error);
        }

        return res.status(200).json({ message: 'Recipe deleted successfully.' });
    } catch (error) {
        console.error('Could not delete recipe:', error);
        return res.status(500).json({ message: 'The server could not delete the recipe.' });
    }
}

module.exports = { deleteRecipe };