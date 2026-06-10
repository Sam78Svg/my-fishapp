import bcrypt from 'bcryptjs';
const hash = "$2b$10$sGwFFSk6Fxxq5YVDX.qjrOEId6En.WMyHoRJPyFUH0TtoUtHeGT0q"

const match = await bcrypt.compare(
    'zudio_admin1',
    hash
);

console.log(match);