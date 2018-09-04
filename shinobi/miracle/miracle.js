var ram = [];
var cartridgeRam = [];
var romBanks = [];
var pages = [];
var ramSelectRegister = 0;
var romPageMask = 0;

var canvas;
var ctx;
var imageData;
var fb8;
var fb32;

var joystick = 0xffff;
var inputMode = 0;

var soundChip;

var initialized = false;

const framesPerSecond = 50; // Refresh rate: 59.922743 Hz (NTSC), 49.701459 Hz (PAL)
const scanLinesPerFrame = 313; // 313 lines in PAL TODO: unify all this
const scanLinesPerSecond = scanLinesPerFrame * framesPerSecond;
const cpuHz = 3.58 * 1000 * 1000; // According to Sega docs.
const tstatesPerHblank = Math.ceil(cpuHz / scanLinesPerSecond) | 0;

function cycleCallback(tstates) {
    soundChip.polltime(tstates);
}

function line() {
    event_next_event = tstatesPerHblank;
    tstates -= tstatesPerHblank;
    z80_do_opcodes(cycleCallback);
    var vdp_status = vdp_hblank();
    var irq = !!(vdp_status & 3);
    z80_set_irq(irq);
    if (vdp_status & 4) {
        paintScreen();
        return true;
    }
    return false;
}

function start() {
    if (!initialized || running) return;
    running = true;
    audio_enable(true);
    run();
}

const targetTimeout = 1000 / framesPerSecond;
const pausedTimeout = 2 * targetTimeout; // eternity
const linesPerYield = 20;

var lastFrame = Date.now();

var cycles = 0; // cycle counter
var cyclet = 0; // cycle time reference

function run() {
    if (!initialized || !running) {
        return;
    }

    setTimeout(run, 0);

    var timeSinceLast = targetTimeout;
    var now = Date.now();
    timeSinceLast = now - lastFrame;
    // Ignore huge delays (e.g. trips in and out of the debugger):
    if (timeSinceLast > pausedTimeout) {
        timeSinceLast = targetTimeout;
    }

    if (now - cyclet > 999) {
        // Ignore huge delays (e.g. trips in and out of the debugger):
        if (now - cyclet - 1000 < targetTimeout) {
            document.getElementById('game-fps').textContent = cycles;
        }
        cycles = 0;
        cyclet = now;
    }

    if (timeSinceLast < targetTimeout) return;

    lastFrame = now - (timeSinceLast % targetTimeout);
    cycles++;

    var runner = function () {
        if (!running) return;
        //try {
            for (var i = 0; i < linesPerYield; ++i) {
                if (line()) return;
            }
        //} catch (err) {
        //    running = false;
        //    audio_enable(false);
        //    throw err;
        //}
        if (running) setTimeout(runner, 0);
    };
    runner();
}

function stop() {
    if (!initialized || !running) return;
    running = false;
    audio_enable(false);
}

function reset() {
    miracle_reset();
}
function pumpAudio(event) {
    var outBuffer = event.outputBuffer;
    var chan = outBuffer.getChannelData(0);
    soundChip.render(chan, 0, chan.length);
}

function audio_init() {
    var context = null;
    if (typeof AudioContext !== 'undefined') {
        context = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
        context = new webkitAudioContext();
    } else {
        // Disable sound without the new APIs.
        x.write('Unable to render audio');
        soundChip = new SoundChip(10000, cpuHz);
        return;
    }
    var jsAudioNode = context.createScriptProcessor(1024, 0, 1);
    jsAudioNode.onaudioprocess = pumpAudio;
    jsAudioNode.connect(context.destination, 0, 0);
    soundChip = new SoundChip(context.sampleRate, cpuHz);
}

function audio_enable(enable) {
    soundChip.enable(enable);
}

function audio_reset() {
    soundChip.reset();
}

function miracle_init() {
    vdp_init();
    audio_init();
    ram = new Uint8Array(0x2000);
    cartridgeRam = new Uint8Array(0x8000);
    pages = new Uint8Array(3);
    miracle_reset();

    canvas = document.getElementById('game-view');
    ctx = canvas.getContext('2d');
    if (ctx.getImageData) {
        imageData = ctx.getImageData(0, 0, 256, 192);
        fb8 = imageData.data;
        fb32 = new Uint32Array(fb8.buffer);
    } else {
        alert('upgrade your browser, dude');
        // Unsupported....
    }
    document.onkeydown = keyDown;
    document.onkeyup = keyUp;
    document.onkeypress = keyPress;

    initialized = true;
}

function miracle_reset() {
    for (var i = 0x0000; i < 0x2000; i++) {
        ram[i] = 0;
    }
    for (i = 0x0000; i < 0x8000; i++) {
        cartridgeRam[i] = 0;
    }
    for (i = 0; i < 3; i++) {
        pages[i] = i;
    }
    ramSelectRegister = 0;
    inputMode = 7;
    z80_reset();
    vdp_reset();
    audio_reset();
}

var keys = {
    87: 1,  // W = JP1 up
    83: 2,  // S = JP1 down
    65: 4,  // A = JP1 left
    68: 8,  // D = JP1 right
    32: 16, // Space = JP1 fire 1
    13: 32, // Enter = JP1 fire 2

    38: 1,  // Arrow keys
    40: 2,
    37: 4,
    39: 8,
    90: 16, // Z = JP1 fire 1
    88: 32, // Y = JP1 fire 2

    82: 1 << 12  // R for reset button
};

function keyCode(evt) {
    return evt.which || evt.charCode || evt.keyCode;
}
function keyDown(evt) {
    if (!running) return;
    var key = keys[keyCode(evt)];
    if (key) {
        joystick &= ~key;
        if (!evt.metaKey) {
            evt.preventDefault();
            return;
        }
    }
    switch (evt.keyCode) {
        case 67:  // 'C' for change
            loadNextRom();
            evt.preventDefault();
            break;
        case 3:  // 'Break' and
        case 19: // 'Pause' and
        case 80:  // 'P' for pause
            z80_nmi();
            evt.preventDefault();
            break;
    }
}

function keyUp(evt) {
    if (!running) return;
    var key = keys[keyCode(evt)];
    if (key) {
        joystick |= key;
        if (!evt.metaKey) {
            evt.preventDefault();
        }
    }
}

function keyPress(evt) {
    if (!running) {
        return;
    }
    if (!evt.metaKey) {
        evt.preventDefault();
    }
}

function paintScreen() {
    ctx.putImageData(imageData, 0, 0);
}

function loadRom(name, rom) {
    var numRomBanks = rom.length / 0x4000;
    var i;
    console.log('Loading rom of ' + numRomBanks + ' banks');
    for (i = 0; i < numRomBanks; i++) {
        romBanks[i] = new Uint8Array(0x4000);
        for (var j = 0; j < 0x4000; j++) {
            romBanks[i][j] = rom.charCodeAt(i * 0x4000 + j);
        }
    }
    for (i = 0; i < 3; i++) {
        pages[i] = i % numRomBanks;
    }
    romPageMask = (numRomBanks - 1) | 0;
    var serial = (romBanks[1][0x3ffc] << 8) | romBanks[1][0x3ffd];
    console.log('Running ' + name + ' serial 0x' + hexword(serial));
}

function hexbyte(value) {
    return ((value >> 4) & 0xf).toString(16) +
        (value & 0xf).toString(16);
}

function hexword(value) {
    return ((value >> 12) & 0xf).toString(16) +
        ((value >> 8) & 0xf).toString(16) +
        ((value >> 4) & 0xf).toString(16) +
        (value & 0xf).toString(16);
}

function virtualAddress(address) {
    function romAddr(bank, addr) {
        return 'rom' + bank.toString(16) + '_' + hexword(addr);
    }

    if (address < 0x0400) {
        return romAddr(0, address);
    }
    if (address < 0x4000) {
        return romAddr(pages[0], address);
    }
    if (address < 0x8000) {
        return romAddr(pages[1], address - 0x4000);
    }
    if (address < 0xc000) {
        if ((ramSelectRegister & 12) === 8) {
            return 'crm_' + hexword(address - 0x8000);
        } else if ((ramSelectRegister & 12) === 12) {
            return 'crm_' + hexword(address - 0x4000);
        } else {
            return romAddr(pages[2], address - 0x8000);
        }
    }
    if (address < 0xe000) {
        return 'ram+' + hexword(address - 0xc000);
    }
    if (address < 0xfffc) {
        return 'ram_' + hexword(address - 0xe000);
    }
    switch (address) {
        case 0xfffc:
            return 'rsr';
        case 0xfffd:
            return 'rpr_0';
        case 0xfffe:
            return 'rpr_1';
        case 0xffff:
            return 'rpr_2';
    }
    return 'unk_' + hexword(address);
}

function readbyte(address) {
    address = address | 0;
    var page = (address >>> 14) & 3;
    address &= 0x3fff;
    switch (page) {
        case 0:
            if (address < 0x0400) {
                return romBanks[0][address];
            }
            return romBanks[pages[0]][address];
        case 1:
            return romBanks[pages[1]][address];
        case 2:
            switch (ramSelectRegister & 12) {
                default:
                    break;
                case 8:
                    return cartridgeRam[address];
                case 12:
                    return cartridgeRam[address + 0x4000];
            }
            return romBanks[pages[2]][address];
        case 3:
            return ram[address & 0x1fff];
    }
}

function writebyte(address, value) {
    address = address | 0;
    value = value | 0;
    if (address >= 0xfffc) {
        switch (address) {
            case 0xfffc:
                ramSelectRegister = value;
                break;
            case 0xfffd:
                value &= romPageMask;
                pages[0] = value;
                break;
            case 0xfffe:
                value &= romPageMask;
                pages[1] = value;
                break;
            case 0xffff:
                value &= romPageMask;
                pages[2] = value;
                break;
            default:
                console.log("zoiks");
        }
    }
    address -= 0xc000;
    if (address < 0) {
        return; // Ignore ROM writes
    }
    ram[address & 0x1fff] = value;
}

function readport(addr) {
    addr &= 0xff;
    switch (addr) {
        case 0x7e:
            return vdp_get_line();
        case 0x7f:
            return vdp_get_x();
        case 0xdc:
        case 0xc0:
            // keyboard: if ((inputMode & 7) != 7) return 0xff;
            return joystick & 0xff;
        case 0xdd:
        case 0xc1:
            // keyboard: if ((inputMode & 7) != 7) return 0xff;
            return (joystick >> 8) & 0xff;
        case 0xbe:
            return vdp_readbyte();
        case 0xbd:
        case 0xbf:
            return vdp_readstatus();
        case 0xde:
            // if we ever support keyboard: return inputMode;
            return 0xff;
        case 0xdf:
            return 0xff; // Unknown use
        case 0xf2:
            return 0; // YM2413
        default:
            console.log('IO port ' + hexbyte(addr) + '?');
            return 0xff;
    }
}

function writeport(addr, val) {
    val = val | 0;
    addr &= 0xff;
    switch (addr) {
        case 0x3f:
            var natbit = ((val >> 5) & 1);
            if ((val & 1) === 0) natbit = 1;
            joystick = (joystick & ~(1 << 14)) | (natbit << 14);
            natbit = ((val >> 7) & 1);
            if ((val & 4) === 0) natbit = 1;
            joystick = (joystick & ~(1 << 15)) | (natbit << 15);
            break;
        case 0x7e:
        case 0x7f:
            soundChip.poke(val);
            break;
        case 0xbd:
        case 0xbf:
            vdp_writeaddr(val);
            break;
        case 0xbe:
            vdp_writebyte(val);
            break;
        case 0xde:
            inputMode = val;
            break;
        case 0xdf:
            break; // Unknown use
        case 0xf0:
        case 0xf1:
        case 0xf2:
            break; // YM2413 sound support: TODO
        case 0x3e:
            break; // enable/disable of RAM and stuff, ignore
        default:
            console.log('IO port ' + hexbyte(addr) + ' = ' + val);
            break;
    }
}
