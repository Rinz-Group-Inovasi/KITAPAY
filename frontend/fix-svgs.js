const fs = require('fs');
const p = './public/logos/';
fs.readdirSync(p).forEach(f => {
  if (f.endsWith('.svg')) {
    let c = fs.readFileSync(p + f, 'utf8');
    if (!c.includes('xmlns=')) {
      c = c.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      fs.writeFileSync(p + f, c);
      console.log('Fixed ' + f);
    }
  }
});
