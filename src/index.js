const hash = require('./hash');
const {generateKeysAndSign, verifySignature } = require('./checkSignature');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

async function zipAndSign(src, hashingOptions) {
  const output = fs.createWriteStream(path.join(__dirname, `${src}.zip`));
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(path.resolve('src'), false);
  archive.finalize();

  output.on('close', async () => {
    const hashObject = await hash(path.resolve(__dirname, `${src}.zip`), hashingOptions)
    const { publicKey, signature } = generateKeysAndSign(hashObject.hash)
    const pubKey = fs.createWriteStream(path.join(__dirname, 'publicKey.pem'))
    const sign = fs.createWriteStream(path.join(__dirname, 'signature.md'))
    pubKey.once('open', () => {
      pubKey.write(publicKey)
    })
    sign.once('open', () => {
      sign.write(signature)
    })
  });
}

module.exports = {
  zipAndSign,
  verifySignature
};
