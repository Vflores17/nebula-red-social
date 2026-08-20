// Script de prueba: crea 2 usuarios usando la misma función registerUser
// que ya usa tu pantalla de Registro (src/pages/Register.jsx).
//
// CÓMO CORRERLO (desde la carpeta frontend/, con Node 18 o superior):
//   node scripts/crear-usuarios-prueba.js
//
// Al terminar, te imprime el UID de cada usuario — cópialos, los vas a
// necesitar en la página /test-solicitudes.

import { registerUser } from "../src/services/authService.js";

const usuarios = [
  { nombre: "Usuario A", email: "usuarioa@test.com", password: "123456" },
  { nombre: "Usuario B", email: "usuariob@test.com", password: "123456" },
];

async function main() {
  for (const u of usuarios) {
    try {
      const user = await registerUser(u.nombre, u.email, u.password);
      console.log(`✅ ${u.nombre} creado — email: ${u.email} | uid: ${user.uid}`);
    } catch (err) {
      // Si ya existe (por correrlo dos veces), Firebase avisa "email-already-in-use"
      console.log(`⚠️  ${u.nombre} (${u.email}): ${err.message}`);
    }
  }

  console.log("\nListo. Usa estos correos para iniciar sesión manualmente:");
  usuarios.forEach((u) => console.log(`  - ${u.email} / ${u.password}`));

  process.exit(0);
}

main();
