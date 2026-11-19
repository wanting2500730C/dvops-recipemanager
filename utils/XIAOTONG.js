const fs = require('node:fs').promises;
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const recipesFile = path.join(__dirname, 'recipes.json');
const templateFile = path.join(__dirname, 'recipes.template.json');
const uploadFolder = path.join(__dirname, '..', 'public', 'uploads');

const cuisines = new Set([
    'Indian', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Other'
]);

const receivePhoto = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
        fields: 1
    }
}).single('photo');

let pendingSave = Promise.resolve();

function uploadRecipePhoto(req, res, next) {
    // Existing callers can still send a recipe as JSON.
    if (!req.is('multipart/form-data')) {
        return next();
    }

    receivePhoto(req, res, function (error) {
        if (error?.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                message: 'Photo must be 2 MB or smaller.'
            });
        }

        if (error) {
            return res.status(400).json({
                message: 'Could not read the photo upload.'
            });
        }

        try {
            req.body = JSON.parse(req.body.recipe);
        } catch {
            return res.status(400).json({ message: 'Invalid recipe data.' });
        }

        next();
    });
}

function getPhotoExtension(buffer) {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    if (pngSignature.every((byte, index) => buffer[index] === byte)) {
        return 'png';
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'jpg';
    }

    return null;
}

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
        await fs.rm(temporaryFile, { force: true }).catch(console.error);
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

    const photo = req.file;
    const extension = photo ? getPhotoExtension(photo.buffer) : null;

    if (photo && !extension) {
        return res.status(400).json({ message: 'Choose a JPG or PNG photo.' });
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

    let photoPath;

    try {
        if (photo) {
            const fileName = `${recipe.id}.${extension}`;

            await fs.mkdir(uploadFolder, { recursive: true });
            photoPath = path.join(uploadFolder, fileName);
            await fs.writeFile(photoPath, photo.buffer);

            recipe.image = `/uploads/${fileName}`;
        }

        // Process Create Recipe saves in order.
        const save = pendingSave.then(() => saveRecipe(recipe));
        pendingSave = save.catch(() => {});
        await save;
    } catch (error) {
        // Clean up the photo if the recipe could not be saved.
        if (photoPath) {
            await fs.rm(photoPath, { force: true }).catch(console.error);
        }

        console.error('Could not save recipe:', error);
        return res.status(500).json({ message: 'The server could not save the recipe.' });
    }

    return res.status(201).json({
        message: 'Recipe saved successfully.',
        recipe
    });
}

module.exports = { createRecipe, uploadRecipePhoto };