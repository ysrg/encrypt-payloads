## Generate and encrypt payloads

This is a module for generating, encrypting and decrypting payloads for your app.

### Usecases

Your app (eg Electron) needs custom frontend updates that could be applied seamlessly.

```js
const Vault = require('encrypt-payloads')

const safe = new Vault('vault.dat', 'your-password')

safe.hashElement(FOLDER_PATH) // 698fc0a07w63a530f66a65d0470ff37b725ec16062bd060bcf8a4a645da27885
  .then(hash => safe.encryptAsync(hash)) //‘!ÓN `›a¡xRÁnz£ûÀ∏wK=ú©ÒF)cîø…Z˘∑?c˘ Ë$s
```

Later in your app you can decrypt using your .dat file generated earlier and compare hashes

```js
safe.decryptAsync()) //698fc0a07w63a530f66a65d0470ff37b725ec16062bd060bcf8a4a645da27885
```

Youc can also sign your hashes and subsequently verify them.

```js
safe.hashElement(FOLDER_PATH)
  .then(r => safe.generateKeysAndSign(r.hash, 'my-key'))
  .then(r => safe.verifySignature()) // true

```

This would mean that the payload hash the same hash, so the there is no need for update, otherwise you can
apply the update knowing the payload has been updated.
