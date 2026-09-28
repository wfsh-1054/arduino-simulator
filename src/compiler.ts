import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export async function compileSketch(sketchPath: string, fqbn: string = 'arduino:avr:uno'): Promise<string> {
    const projectRoot = path.resolve(__dirname, '..');
    const localCliPath = path.join(projectRoot, 'bin', process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
    const localConfigPath = path.join(projectRoot, 'arduino-cli.yaml');

    let cliBinary = 'arduino-cli';
    let extraFlags = '';

    if (fs.existsSync(localCliPath)) {
        cliBinary = `"${localCliPath}"`;
        console.log(`Using local arduino-cli binary at: ${localCliPath}`);
    }

    if (fs.existsSync(localConfigPath)) {
        extraFlags += `--config-file "${localConfigPath}" `;
    }

    const sketchName = path.basename(sketchPath, path.extname(sketchPath));
    const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arduino-build-'));
    
    console.log(`Compiling sketch: ${sketchPath}`);
    console.log(`FQBN: ${fqbn}`);
    console.log(`Build directory: ${buildDir}`);

    try {
        const command = `${cliBinary} compile ${extraFlags}--fqbn ${fqbn} --output-dir "${buildDir}" "${sketchPath}"`;
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && !stderr.includes('Warning')) {
            console.error(stderr);
        }
        
        console.log(stdout);

        const hexPath = path.join(buildDir, `${sketchName}.ino.hex`);
        if (!fs.existsSync(hexPath)) {
            throw new Error(`Compilation succeeded but HEX file not found at ${hexPath}`);
        }
        
        return hexPath;
    } catch (error) {
        console.error('Compilation failed:', error);
        throw error;
    }
}
