const bcrypt = require('bcryptjs');

// Cifra la contraseña antes de almacenarla
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Ejemplo
const plainPassword = '123456';
hashPassword(plainPassword).then((hashedPassword) => {
  console.log('Hashed Password:', hashedPassword);
  // Almacena este hashedPassword en tu base de datos
});
