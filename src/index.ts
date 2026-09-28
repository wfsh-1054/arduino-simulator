#!/usr/bin/env node

import { Command } from 'commander';
import { compileSketch } from './compiler';
import { Simulator } from './simulator';
import * as path from 'path';

const program = new Command();

program
    .name('arduino-sim')
    .description('CLI to simulate Arduino ATmega328P sketches using avr8js and arduino-cli')
    .version('1.0.0');

program
    .command('run <sketchPath>')
    .description('Compile and run an Arduino sketch in the simulator')
    .option('--fqbn <fqbn>', 'Fully Qualified Board Name', 'arduino:avr:uno')
    .action(async (sketchPath, options) => {
        try {
            const absoluteSketchPath = path.resolve(sketchPath);
            console.log(`--- Step 1: Compiling ---`);
            const hexPath = await compileSketch(absoluteSketchPath, options.fqbn);
            
            console.log(`\n--- Step 2: Simulating ---`);
            const simulator = new Simulator(hexPath);
            simulator.run();
        } catch (error) {
            console.error('Failed to run sketch:', error);
            process.exit(1);
        }
    });

program.parse(process.argv);
