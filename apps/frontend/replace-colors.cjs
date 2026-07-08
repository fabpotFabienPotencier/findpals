const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');

const filesToUpdate = [
    'SettingsPage.tsx',
    'OnboardingPage.tsx',
    'MessagingPage.tsx',
    'LiveStreamPage.tsx',
    'FeedPage.tsx',
    'CreatorHub.tsx'
];

filesToUpdate.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/cyan-500/g, 'blue-500');
        content = content.replace(/cyan-400/g, 'blue-400');
        content = content.replace(/cyan-300/g, 'blue-300');
        content = content.replace(/rgba\(34,211,238/g, 'rgba(0,85,255');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    }
});
