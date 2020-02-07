const { hashElement } = require('folder-hash');

const hashingOptions = {
  folders: { exclude: ['node_modules'] },
  algo: 'sha256',
  encoding: 'hex',
};

function hash(src) {
    return hashElement(src, opts = hashingOptions)
    .then(hash => {
        return hash
    })
}


module.exports = hash;