const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let conn;
  try {
    // Connexion à la base de données
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'glamgo_marrakech',
      multipleStatements: true
    });

    console.log('✓ Connexion à la base de données réussie');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'fix_all_images.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('✓ Fichier SQL chargé');

    // Séparer et exécuter les requêtes
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'SET NAMES utf8mb4');

    console.log(`\n📝 Exécution de ${statements.length} requêtes...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const stmt of statements) {
      try {
        const [results] = await conn.execute(stmt);

        if (stmt.toUpperCase().startsWith('UPDATE')) {
          const affectedRows = results.affectedRows || 0;
          if (affectedRows > 0) {
            successCount++;
            console.log(`✓ ${affectedRows} service(s) mis à jour`);
          }
        } else if (stmt.toUpperCase().startsWith('SELECT')) {
          console.log('✓ Statut:', results[0]?.status || 'OK');
        }
      } catch (e) {
        errorCount++;
        console.error(`✗ Erreur:`, e.message);
        console.error(`  SQL:`, stmt.substring(0, 100) + '...');
      }
    }

    console.log(`\n✅ Migration terminée!`);
    console.log(`   - Succès: ${successCount}`);
    console.log(`   - Erreurs: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
      console.log('\n✓ Connexion fermée');
    }
  }
}

runMigration();
