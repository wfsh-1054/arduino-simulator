import * as fs from 'fs';
import { CPU, AVRTimer, timer0Config, AVRUSART, usart0Config, AVRIOPort, portBConfig, PinState, avrInstruction } from 'avr8js';

const intelHex = require('intel-hex');

export class Simulator {
    private cpu: CPU;
    private usart: AVRUSART;
    private portB: AVRIOPort;
    
    constructor(hexPath: string) {
        console.log(`Loading HEX file: ${hexPath}`);
        const hexContent = fs.readFileSync(hexPath, 'utf-8');
        
        // Parse the HEX file
        const hexData = intelHex.parse(hexContent).data;
        
        // ATmega328P has 32KB of flash memory (16K 16-bit words)
        const program = new Uint16Array(16384);
        
        for (let i = 0; i < hexData.length; i += 2) {
            program[i / 2] = hexData[i] | (hexData[i + 1] << 8);
        }
        
        // Initialize CPU
        this.cpu = new CPU(program);
        
        // Initialize Timer 0 (millis(), micros(), delay())
        new AVRTimer(this.cpu, timer0Config);
        
        // Initialize Port B (Digital Pins 8-13, Pin 13 is PB5)
        this.portB = new AVRIOPort(this.cpu, portBConfig);
        let lastPin13State: PinState | null = null;
        
        // Listen for GPIO Pin Changes on Port B
        this.portB.addListener(() => {
            const pin13 = this.portB.pinState(5); // PB5 = Arduino Pin 13
            if (pin13 !== lastPin13State) {
                lastPin13State = pin13;
                if (pin13 === PinState.High) {
                    console.log('   [Hardware] 🟢 Pin 13 (LED) -> HIGH');
                } else if (pin13 === PinState.Low) {
                    console.log('   [Hardware] 🔴 Pin 13 (LED) -> LOW');
                }
            }
        });
        
        // Initialize USART0 (Serial Output)
        this.usart = new AVRUSART(this.cpu, usart0Config, 16e6);
        this.usart.onByteTransmit = (byte: number) => {
            process.stdout.write(String.fromCharCode(byte));
        };
    }
    
    public run(clockFreq: number = 16e6) {
        console.log('Starting simulation (Press Ctrl+C to stop)...');
        
        const chunkMs = 10;
        const cyclesPerChunk = (clockFreq * chunkMs) / 1000;
        
        const runChunk = () => {
            const targetCycles = this.cpu.cycles + cyclesPerChunk;
            while (this.cpu.cycles < targetCycles) {
                avrInstruction(this.cpu);
                this.cpu.tick();
            }
            setTimeout(runChunk, chunkMs);
        };
        
        runChunk();
    }
}
