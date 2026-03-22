const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('.next')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'package.json') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.charCodeAt(0) === 0xFEFF) {
                console.log('Fixing BOM in', fullPath);
                fs.writeFileSync(fullPath, content.substring(1), 'utf8');
            }
        }
    }
}
processDir(__dirname);
