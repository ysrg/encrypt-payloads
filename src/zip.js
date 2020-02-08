const path = require('path');
const fs = require('fs');

const archiver = require('archiver');

function zip(src, hashingOptions) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(__dirname, `${src}.zip`));
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(path.resolve('src'), false);
    archive.finalize();

    output.on('finish', () => resolve('zip file successfully created'));
    output.on('error', reject)
  })
}

module.exports = zip;
