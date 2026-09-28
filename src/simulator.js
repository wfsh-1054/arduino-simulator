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
exports.Simulator = void 0;
const fs = __importStar(require("fs"));
const avr8js_1 = require("avr8js");
// intel-hex doesn't have official TS types in definitely typed usually, using require
const intelHex = require('intel-hex');
class Simulator {
    cpu;
    usart;
    constructor(hexPath) {
        console.log(`Loading HEX file: ${hexPath}`);
        const hexContent = fs.readFileSync(hexPath, 'utf-8');
        // Parse the HEX file
        const hexData = intelHex.parse(hexContent).data;
        // ATmega328P has 32KB of flash memory, which is 16K words (16-bit)
        const program = new Uint16Array(16384);
        // Pack 8-bit hex data into 16-bit words for the AVR CPU
        for (let i = 0; i < hexData.length; i += 2) {
            program[i / 2] = hexData[i] | (hexData[i + 1] << 8);
        }
        // Initialize CPU
        this.cpu = new avr8js_1.CPU(program);
        // Initialize Timer 0 (Required for Arduino millis(), micros(), delay())
        const timer0 = new avr8js_1.AVRTimer(this.cpu, 0);
        // Initialize Timer 1, 2 if needed later...
        // Initialize USART0 (Serial) for console output
        // Assume 16 MHz clock
        this.usart = new avr8js_1.AVRUSART(this.cpu, avr8js_1.usart0Config, 16e6);
        // Listen to characters being sent via Serial
        this.usart.onByteTransmit = (byte) => {
            process.stdout.write(String.fromCharCode(byte));
        };
    }
    run(clockFreq = 16e6) {
        console.log('Starting simulation (Press Ctrl+C to stop)...');
        // To not block the Node.js event loop completely, we run instructions in chunks.
        // Let's run chunks of instructions every 10ms
        const chunkMs = 10;
        const cyclesPerChunk = (clockFreq * chunkMs) / 1000;
        const runChunk = () => {
            const targetCycles = this.cpu.cycles + cyclesPerChunk;
            while (this.cpu.cycles < targetCycles) {
                this.cpu.tick();
            }
            setTimeout(runChunk, chunkMs);
        };
        runChunk();
    }
}
exports.Simulator = Simulator;
//# sourceMappingURL=simulator.js.map