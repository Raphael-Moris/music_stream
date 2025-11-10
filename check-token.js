// Script pour vérifier le contenu d'un token JWT
const jwt = require('jsonwebtoken');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 VÉRIFICATION TOKEN JWT\n');
console.log('Collez votre token (depuis localStorage.getItem("token") dans la console du navigateur) :\n');

rl.question('Token: ', (token) => {
  try {
    // Décoder sans vérifier la signature (juste pour voir le contenu)
    const decoded = jwt.decode(token);

    console.log('\n✅ Contenu du token:');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n📋 Informations extraites:');
    console.log(`   - User ID: ${decoded.id}`);
    console.log(`   - Username: ${decoded.username || 'N/A'}`);
    console.log(`   - Role: ${decoded.role || 'N/A'}`);

    if (decoded.exp) {
      const expDate = new Date(decoded.exp * 1000);
      console.log(`   - Expire le: ${expDate.toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Erreur décodage token:', error.message);
  }

  rl.close();
});
