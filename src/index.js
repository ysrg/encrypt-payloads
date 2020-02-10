const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { hashElement: hashEl } = require('folder-hash');

class Vault {
  constructor(filePath, password, hashingOptions) {
    this.filePath = filePath;
    this.password = password;
    this.hashingOptions = hashingOptions;
    this.hash = '';
  }

  hashElement(src, opts) {
    const defaultOptions = {
      folders: { exclude: ['node_modules'] },
      algo: 'sha256',
      encoding: 'hex'
    };
    return hashEl(
      path.resolve(__dirname, src),
      (this.hashingOptions = defaultOptions)
    );
  }

  hashZip(src, opts) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const input = fs.createReadStream(path.resolve(__dirname, src));
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

  zip(src) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(path.join(__dirname, `${src}.zip`));
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(path.resolve(__dirname, src), false);
      archive.finalize();

      output.on('finish', () => resolve('zip file successfully created'));
      output.on('error', reject);
    });
  }

  encryptStream(url) {
    const file = fs.createReadStream(path.resolve(__dirname, url));
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
      const cipher = crypto.createCipher('aes-256-cbc', this.password);
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
      const decipher = crypto.createDecipher('aes-256-cbc', this.password);
      const decrypted = Buffer.concat([
        decipher.update(data),
        decipher.final()
      ]);
      return JSON.parse(decrypted.toString());
    } catch (err) {
      throw new Error(err.message);
    }
  }

  encryptAsync() {
    const data = this.hash;
    return new Promise((resolve, reject) => {
      try {
        const cipher = crypto.createCipher('aes-256-cbc', this.password);
        const encrypted = Buffer.concat([
          cipher.update(Buffer.from(JSON.stringify(data), 'utf8')),
          cipher.final()
        ]);
      } catch (err) {
        reject({ message: err.message });
      }
      fs.writeFile(this.filePath, encrypted, error => {
        if (error) {
          reject(error);
        }
        resolve({ message: 'Encrypted!' });
      });
    });
  }

  decryptAsync() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, (error, data) => {
        if (error) {
          reject(error);
        }
        try {
          const decipher = crypto.createDecipher('aes-256-cbc', this.password);
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
}

exports.Vault = Vault;
