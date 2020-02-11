const fs = require('fs');
const path = require('path');
const {
  createHash,
  createCipher,
  createDecipher,
  createVerify,
  createSign,
  generateKeyPairSync
} = require('crypto');
const archiver = require('archiver');
const { hashElement: hashEl } = require('folder-hash');

class Vault {
  constructor(filePath, password, hashingOptions) {
    this.filePath = filePath;
    this.password = password;
    this.hashingOptions = hashingOptions;
    this.hash = '';
  }

  async hashElement(src, opts) {
    const defaultOptions = opts || {
      folders: { exclude: ['node_modules'] },
      algo: 'sha256',
      encoding: 'hex'
    };
    const result = await hashEl(path.resolve(src), (this.hashingOptions = defaultOptions))
    fs.writeFileSync('hash.dat', result.hash)
    return new Promise((resolve, reject) => {
      if (!result) {
        reject('Hashing failed')
      }
      resolve(result)
    });
  }

  hashZip(src, opts) {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const input = fs.createReadStream(path.resolve(src));
      input.on('readable', () => {
        const data = input.read();
        if (data) hash.update(data);
      });
      input.on('end', () => {
        const result = hash.digest('hex');
        this.hash = result;
        resolve(result);
      });
      input.on('error', reject);
    });
  }

  zip(src, zipName) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(
        path.join(path.resolve(src), `${zipName}.zip`)
      );
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(path.resolve(src), false);
      archive.finalize();

      output.on('finish', () => resolve('zip file successfully created'));
      output.on('error', reject);
    });
  }

  encryptStream(url) {
    const file = fs.createReadStream(url);
    // const chunks = []
    // for await (let chunk of x) {
    //   chunks.push(chunk)
    // }
    // console.log(Buffer.concat(chunks))
    let actualContents;
    const buffers = [];
    file.on('data', function(chunk) {
      buffers.push(chunk);
    });
    file.on('end', function() {
      actualContents = Buffer.concat(buffers);
    });
    try {
      const cipher = createCipher('aes-256-cbc', this.password);
      const encrypted = Buffer.concat([
        cipher.update(Buffer.concat(buffers)),
        cipher.final()
      ]);
      fs.writeFileSync(this.filePath, encrypted);
      return { message: 'File encrypted successfully' };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  decrypt() {
    try {
      const data = fs.readFileSync(this.filePath);
      const decipher = createDecipher('aes-256-cbc', this.password);
      const decrypted = Buffer.concat([
        decipher.update(data),
        decipher.final()
      ]);
      return JSON.parse(decrypted.toString());
    } catch (err) {
      throw new Error(err.message);
    }
  }

  encryptAsync(hash) {
    const data = this.hash || hash;
    return new Promise((resolve, reject) => {
      try {
        const cipher = createCipher('aes-256-cbc', this.password);
        const encrypted = Buffer.concat([
          cipher.update(Buffer.from(JSON.stringify(data), 'utf8')),
          cipher.final()
        ]);

        fs.writeFile(this.filePath, encrypted, error => {
          if (error) {
            reject(error);
          }
          resolve({ message: 'Encrypted!' });
        });
      } catch (err) {
        reject({ message: err.message });
      }
    });
  }

  decryptAsync() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, (error, data) => {
        if (error) {
          reject(error);
        }
        try {
          const decipher = createDecipher('aes-256-cbc', this.password);
          const decrypted = Buffer.concat([
            decipher.update(data),
            decipher.final()
          ]);

          resolve(decrypted.toString());
        } catch (err) {
          reject({ message: err.message });
        }
      });
    });
  }

  generateKeysAndSign(str, filename, opts) {
    const signOptions = opts || {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    };
    const { publicKey, privateKey } = generateKeyPairSync('rsa', signOptions);

    const verifier = createVerify('sha256');
    const signer = createSign('sha256');
    const pubKey = fs.createWriteStream(`${filename}_pk.pem`);
    const sign = fs.createWriteStream(`${filename}_sign.dat`);

    signer.update(str);
    const signature = signer.sign(privateKey, 'base64');
    verifier.update(str);

    this.verifier = verifier;
    this.publicKey = publicKey;
    this.signature = signature;

    pubKey.once('open', () => {
      pubKey.write(publicKey);
    });
    sign.once('open', () => {
      sign.write(signature);
    });

    return { publicKey, signature };
  }

  verifySignature(pubKey, sign, str) {
    const verifier = createVerify('sha256');
    verifier.update(str);
    return verifier.verify(pubKey, sign, 'base64');
  }
}

exports.Vault = Vault;
