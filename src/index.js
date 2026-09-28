#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const compiler_1 = require("./compiler");
const simulator_1 = require("./simulator");
const path = __importStar(require("path"));
const program = new commander_1.Command();
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
        const hexPath = await (0, compiler_1.compileSketch)(absoluteSketchPath, options.fqbn);
        console.log(`\n--- Step 2: Simulating ---`);
        const simulator = new simulator_1.Simulator(hexPath);
        simulator.run();
    }
    catch (error) {
        console.error('Failed to run sketch:', error);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map