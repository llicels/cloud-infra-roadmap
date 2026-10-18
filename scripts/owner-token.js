#!/usr/bin/env node
/**
 * Gera um token secreto de edição e o SHA-256 correspondente.
 *
 * Uso:
 *   npm run owner-token            # gera um token novo
 *   npm run owner-token -- <token> # calcula o hash de um token existente
 *
 * 1. Cole o HASH em data/progress.js -> editHash.
 * 2. Guarde o TOKEN no seu gerenciador de senhas (não vai para o git).
 * 3. Abra o site com #edit=<TOKEN> para editar.
 */
'use strict';

const crypto = require('crypto');

const arg = process.argv[2];
const token = arg || crypto.randomBytes(32).toString('base64url');
const hash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');

console.log('');
console.log('TOKEN (guarde em segredo, NÃO commite):');
console.log('  ' + token);
console.log('');
console.log('editHash (cole em data/progress.js):');
console.log('  ' + hash);
console.log('');
console.log('URL de edição:');
console.log('  <site>/#edit=' + token);
console.log('');
