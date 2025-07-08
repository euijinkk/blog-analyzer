// prompt.js
const fs = require('fs');
module.exports = async function ({ vars }) {
  // 파일에서 프롬프트 내용을 읽어옴
  const systemPrompt = fs.readFileSync('./src/gen-ai/common-prompt.ts', 'utf-8');
  const userPrompt = fs.readFileSync('./fixtures/test1.txt', 'utf-8');
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
};