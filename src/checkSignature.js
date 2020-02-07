const { createVerify, createSign, generateKeyPairSync, publicEncrypt, publicDecrypt, privateDecrypt, privateEncrypt } = require('crypto');
const verifier = createVerify('sha256');
const signer = createSign('sha256')

const signOptions = {
  modulusLength: 4096,
  publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
  },
  privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
  }
}
function generateKeysAndSign(str) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', opts = signOptions);

    signer.update(str);
    const signature = signer.sign(privateKey,'base64');
    verifier.update(str);
    return { publicKey, signature }
}

function verifySignature(pubKey, sign) {
  return verifier.verify(pubKey, sign,'base64');
}

module.exports = {
  generateKeysAndSign,
  verifySignature
}