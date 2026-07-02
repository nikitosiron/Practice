const bcrypt = require('bcrypt');

const plain = process.argv[2];
if (!plain) {
    console.error('Укажи пароль: node scripts/hash-password.js <пароль>');
    process.exit(1);
}

bcrypt.hash(plain, 12).then((hash) => {
    console.log(hash);
});