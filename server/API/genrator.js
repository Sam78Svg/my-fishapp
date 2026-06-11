import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash("SangamKendre", 10);

console.log("HASH:", hash);
const match = await bcrypt.compare(
    'SangamKendre',
    hash
);

console.log(match);