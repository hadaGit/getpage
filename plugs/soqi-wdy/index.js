
const fs = require('fs')
const path = require('path')
const md5 = require('md5');
const sum = require('./sum');

console.log(6666666)
console.error('错误')
sum(1,5);

module.exports.articleHandle = function (article) {
  const { body, name, link, title } = article
  console.log({ body, name, link, title })
}
