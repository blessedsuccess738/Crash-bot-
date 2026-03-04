import { FingerprintSpoof } from './bypass/fingerprint-spoof.js';
import { ProxyRotator } from './bypass/proxy-rotator.js';
import { StealthDriver } from './bypass/stealth-driver.js';

import { WSHook } from './inject/ws-hook.js';
import { ReactStateHijack } from './inject/react-state-hijack.js';
import { AutoBetPayload } from './inject/auto-bet-payload.js';

import { CDPListener } from './fetch/cdp-listener.js';
import { MemoryScanner } from './fetch/memory-scanner.js';

import { PacketDecoder } from './read/packet-decoder.js';
import { HashVerifier } from './read/hash-verifier.js';
import { StateParser } from './read/state-parser.js';

import { NeuralNet } from './calculate/neural-net.js';
import { StandardDeviation } from './calculate/standard-deviation.js';
import { RNGAnalyzer } from './calculate/rng-analyzer.js';

import { NextTickPredictor } from './plan/next-tick-predictor.js';
import { ActionDispatcher } from './plan/action-dispatcher.js';

export class MasterController {
  constructor() {
    // Bypass
    this.fingerprintSpoof = new FingerprintSpoof();
    this.proxyRotator = new ProxyRotator();
    this.stealthDriver = new StealthDriver();
    
    // Inject
    this.wsHook = new WSHook();
    this.reactStateHijack = new ReactStateHijack();
    this.autoBetPayload = new AutoBetPayload();
    
    // Fetch
    this.cdpListener = new CDPListener();
    this.memoryScanner = new MemoryScanner();
    
    // Read
    this.packetDecoder = new PacketDecoder();
    this.hashVerifier = new HashVerifier();
    this.stateParser = new StateParser();
    
    // Calculate
    this.neuralNet = new NeuralNet();
    this.standardDeviation = new StandardDeviation();
    this.rngAnalyzer = new RNGAnalyzer();
    
    // Plan
    this.nextTickPredictor = new NextTickPredictor();
    this.actionDispatcher = new ActionDispatcher();
  }

  async initialize(page) {
    console.log('[CORE] Initializing Master Controller...');
    
    // 1. BYPASS
    await this.stealthDriver.apply(page);
    await this.fingerprintSpoof.apply(page);
    
    // 2. INJECT
    await this.wsHook.inject(page);
    await this.reactStateHijack.inject(page);
    await this.autoBetPayload.inject(page);
    
    // 3. FETCH & READ
    await this.cdpListener.attach(page, this.handleNewData.bind(this));
  }

  async handleNewData(rawData) {
    // 4. READ
    const decoded = this.packetDecoder.decode(rawData);
    const parsedState = this.stateParser.parse(decoded);
    
    if (!parsedState) return;

    // 5. CALCULATE
    const analysis = await this.neuralNet.process(parsedState);
    const stdDev = this.standardDeviation.calculate(this.neuralNet.history);
    
    // 6. PLAN
    const predictedCrash = this.nextTickPredictor.predict(analysis);
    const plan = this.actionDispatcher.dispatch(predictedCrash);
    
    return plan;
  }
}
