const fs = require('fs');
const path = require('path');

const replacements = {
    'bg-zinc-950': 'bg-background',
    'bg-zinc-900': 'bg-card',
    'bg-zinc-800': 'bg-accent',
    'border-zinc-800': 'border-border',
    'border-zinc-700': 'border-border',
    'text-white': 'text-foreground',
    'text-zinc-400': 'text-muted-foreground',
    'dark:bg-black': '',
    'bg-zinc-50': 'bg-background'
};

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, value);
            modified = true;
        }
    }

    if (modified) {
        // Clean up any double spaces that might be created by empty strings
        content = content.replace(/  +/g, ' ');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx'))) {
            replaceInFile(fullPath);
        }
    }
}

const appDir = path.join(__dirname, 'app');
const componentsDir = path.join(__dirname, 'components');

walkDir(appDir);
walkDir(componentsDir);
