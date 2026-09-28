const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const ARDUINO_DATA_DIR = path.join(PROJECT_ROOT, 'arduino-data');
const CLI_PATH = path.join(BIN_DIR, 'arduino-cli.exe');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'arduino-cli.yaml');

async function getLatestReleaseUrl() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/arduino/arduino-cli/releases/latest',
            headers: { 'User-Agent': 'Node.js' }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const asset = json.assets.find(a => a.name.endsWith('Windows_64bit.zip'));
                    if (asset) {
                        resolve(asset.browser_download_url);
                    } else {
                        reject(new Error('Windows 64bit zip asset not found'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = (downloadUrl) => {
            https.get(downloadUrl, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return request(res.headers.location);
                }
                res.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        };
        request(url);
    });
}

async function main() {
    console.log('=== Setting up local Arduino CLI & Core ===');
    
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CLI_PATH)) {
        console.log('Fetching latest arduino-cli release URL...');
        const downloadUrl = await getLatestReleaseUrl();
        const zipPath = path.join(BIN_DIR, 'arduino-cli.zip');

        console.log(`Downloading arduino-cli from ${downloadUrl}...`);
        await downloadFile(downloadUrl, zipPath);

        console.log('Extracting arduino-cli.zip...');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${BIN_DIR}' -Force; Remove-Item '${zipPath}'"`);
        console.log('arduino-cli installed successfully to ./bin/');
    } else {
        console.log('arduino-cli binary already exists at ./bin/arduino-cli.exe');
    }

    // Write custom yaml config
    const yamlConfig = `directories:
  data: "${ARDUINO_DATA_DIR.replace(/\\/g, '/')}"
  downloads: "${path.join(ARDUINO_DATA_DIR, 'staging').replace(/\\/g, '/')}"
  user: "${path.join(ARDUINO_DATA_DIR, 'user').replace(/\\/g, '/')}"
`;
    fs.writeFileSync(CONFIG_PATH, yamlConfig);
    console.log(`Created local config at ${CONFIG_PATH}`);

    const configFlag = `--config-file "${CONFIG_PATH}"`;

    console.log('Updating core index locally...');
    execSync(`"${CLI_PATH}" core update-index ${configFlag}`, { stdio: 'inherit' });

    console.log('Installing arduino:avr core locally...');
    execSync(`"${CLI_PATH}" core install arduino:avr ${configFlag}`, { stdio: 'inherit' });

    console.log('\n=== Local Setup Complete! ===');
}

main().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
