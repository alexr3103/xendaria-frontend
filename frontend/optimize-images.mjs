import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = "./src/assets";
const tempDir = "./src/assets/__optimized__";

// Crear carpeta temporal si no existe
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

fs.readdirSync(inputDir).forEach(async (file) => {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".png") {
    const inputPath = `${inputDir}/${file}`;
    const tempOutputPath = `${tempDir}/${file}`;

    console.log("🔧 Optimizing:", file);

    await sharp(inputPath)
      .resize({
        width: 1600,
        withoutEnlargement: true,
      })
      .png({
        quality: 90,
        compressionLevel: 9,
        palette: true,
      })
      .toFile(tempOutputPath);

    // Sobreescribir el archivo original con el optimizado
    fs.copyFileSync(tempOutputPath, inputPath);

    console.log("✅ Replaced:", file);
  }
});

// Borrar carpeta temporal al final
process.on("exit", () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("🧹 Cleaned temporary files!");
});
