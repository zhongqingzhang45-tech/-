const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/live2d-models/azurlane');

function verifyModel(modelDir) {
  const modelName = path.basename(modelDir);
  const modelJsonPath = path.join(modelDir, `${modelName}.model3.json`);
  
  const result = {
    name: modelName,
    valid: true,
    errors: [],
    warnings: [],
    info: {}
  };

  if (!fs.existsSync(modelJsonPath)) {
    result.valid = false;
    result.errors.push(`model3.json not found: ${modelJsonPath}`);
    return result;
  }

  try {
    const model3Obj = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    result.info.version = model3Obj.Version;
    
    if (model3Obj.FileReferences) {
      if (model3Obj.FileReferences.Moc) {
        const mocPath = path.join(modelDir, model3Obj.FileReferences.Moc);
        if (!fs.existsSync(mocPath)) {
          result.valid = false;
          result.errors.push(`Moc file not found: ${model3Obj.FileReferences.Moc}`);
        } else {
          const stats = fs.statSync(mocPath);
          result.info.mocSize = stats.size;
          if (stats.size < 1000) {
            result.warnings.push(`Moc file is suspiciously small: ${stats.size} bytes`);
          }
        }
      } else {
        result.valid = false;
        result.errors.push('No Moc reference in model3.json');
      }

      if (model3Obj.FileReferences.Textures) {
        result.info.textureCount = model3Obj.FileReferences.Textures.length;
        model3Obj.FileReferences.Textures.forEach((tex, i) => {
          const texPath = path.join(modelDir, tex);
          if (!fs.existsSync(texPath)) {
            result.valid = false;
            result.errors.push(`Texture not found: ${tex}`);
          }
        });
      } else {
        result.warnings.push('No textures defined');
      }

      if (model3Obj.FileReferences.Physics) {
        const physicsPath = path.join(modelDir, model3Obj.FileReferences.Physics);
        if (!fs.existsSync(physicsPath)) {
          result.warnings.push(`Physics file not found: ${model3Obj.FileReferences.Physics}`);
        }
      }

      if (model3Obj.FileReferences.Motions) {
        let motionCount = 0;
        for (const group in model3Obj.FileReferences.Motions) {
          model3Obj.FileReferences.Motions[group].forEach(mot => {
            motionCount++;
            const motPath = path.join(modelDir, mot.File);
            if (!fs.existsSync(motPath)) {
              result.warnings.push(`Motion not found: ${mot.File}`);
            }
          });
        }
        result.info.motionCount = motionCount;
      }

      if (model3Obj.FileReferences.Expressions) {
        result.info.expressionCount = model3Obj.FileReferences.Expressions.length;
      }
    }

    if (model3Obj.Groups) {
      result.info.hasGroups = true;
    }

  } catch (e) {
    result.valid = false;
    result.errors.push(`Failed to parse model3.json: ${e.message}`);
  }

  return result;
}

function main() {
  if (!fs.existsSync(modelsDir)) {
    console.error('Models directory not found:', modelsDir);
    process.exit(1);
  }

  const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
  const modelDirs = entries.filter(e => e.isDirectory()).map(e => path.join(modelsDir, e.name));

  console.log(`Found ${modelDirs.length} model directories\n`);

  const validModels = [];
  const invalidModels = [];

  modelDirs.forEach(modelDir => {
    const result = verifyModel(modelDir);
    if (result.valid) {
      validModels.push(result);
      console.log(`✅ ${result.name}`);
      console.log(`   Textures: ${result.info.textureCount || 0}, Motions: ${result.info.motionCount || 0}, Moc: ${(result.info.mocSize / 1024).toFixed(1)}KB`);
    } else {
      invalidModels.push(result);
      console.log(`❌ ${result.name}`);
      result.errors.forEach(err => console.log(`   Error: ${err}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    }
    console.log();
  });

  console.log('\n=== Summary ===');
  console.log(`Valid: ${validModels.length}`);
  console.log(`Invalid: ${invalidModels.length}`);
  console.log(`Total: ${modelDirs.length}`);

  if (invalidModels.length > 0) {
    console.log('\n=== Invalid Models ===');
    invalidModels.forEach(m => console.log(`  - ${m.name}`));
  }

  console.log('\n=== Valid Model Names ===');
  console.log(JSON.stringify(validModels.map(m => m.name), null, 2));
}

main();
