const express = require('express');
const mariadb = require('mariadb');
const DBOptions = {
  host: 'localhost', 
  user:'milall',
  database: 'milall',
  idleTimeout: 0
};
const app = express();
const pool = mariadb.createPool(DBOptions);
(async function() { db = await pool.getConnection(); })();

app.listen(3110, async function() {
  db = await pool.getConnection();
  console.log('Express is listening on port 3110');
  setInterval(async function() {
    try { await db.query('SHOW TABLES;'); }
    catch(e) { db = await pool.getConnection(); }
  }, 300000);
});