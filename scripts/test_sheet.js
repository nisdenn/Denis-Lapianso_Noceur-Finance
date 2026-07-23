const { match } = require('assert');
const sheetId = 'https://docs.google.com/spreadsheets/d/1KMQcqBQchy03gZRdD4nyhIkZCeWWEqtZUgUI7rMRKs0/edit?gid=202700981#gid=202700981';
const m = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
console.log(m ? m[1] : 'no match');
