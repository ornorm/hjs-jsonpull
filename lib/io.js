/** @babel */
import * as char from "hjs-core/lib/char";
import * as util from "hjs-core/lib/util";
import {ByteBuffer} from 'hjs-io/lib/buffer';

export const ERROR = -1;
export const NEED_MORE_INPUT = 0;
export const START_OBJECT = 1;
export const END_OBJECT = 2;
export const START_ARRAY = 3;
export const END_ARRAY = 4;
export const FIELD_NAME = 5;
export const VALUE_STRING = 6;
export const VALUE_INT = 7;
export const VALUE_DOUBLE = 8;
export const VALUE_TRUE = 9;
export const VALUE_FALSE = 10;
export const VALUE_NULL = 11;
export const EOF = 99;

export class JsonStream {

    constructor() {

    }

    read(b, offset=0, len=0) {

    }

    isFull() {

    }

    done() {

    }

    hasInput() {

    }

    isDone() {

    }

    nextInput() {

    }
}

export class JsonBuffer extends JsonStream {

    constructor({ capacity = 1024} = null) {
        super();
        this.byteBuf = ByteBuffer.allocate({ capacity });
        this.charBuf = ByteBuffer.allocate({ capacity: capacity * 2 });
        this.charBuf.limit(0);
        this.ok = false;
    }

    done() {
        this.ok = true;
    }

    read(b, offset=0, len=0) {
        if (typeof b === 'number') {
            if (this.isFull()) {
                throw new RangeError("IllegalStateException JSON parser is full");
            }
            this.byteBuf.put(b);
            return 1;
        }
        if (len === 0) {
            len = b.length;
        }
        let i = offset;
        let j = offset + len;
        let position = this.byteBuf.position();
        let limit = this.byteBuf.limit();
        let arr = this.byteBuf.array();
        while (i < j && position < limit) {
            arr[position] = b[i];
            ++i;
            ++position;
        }
        this.byteBuf.position(position);
        return i - offset;
    }

    fillBuffer() {
        if (this.charBuf.hasRemaining()) {
            return true;
        }
        if (this.byteBuf.position() === 0) {
            return false;
        }
        this.charBuf.position(0);
        this.charBuf.limit(this.charBuf.capacity());
        this.byteBuf.flip();
        let position = this.byteBuf.position();
        let limit = this.byteBuf.limit();
        while (position < limit) {
            this.charBuf.put(this.byteBuf.get());
            ++position;
        }
        this.charBuf.flip();
        this.byteBuf.compact();
        return this.charBuf.hasRemaining();
    }

    hasInput() {
        return this.fillBuffer();
    }

    isDone() {
        return this.ok && !this.hasInput();
    }

    isFull() {
        return !this.byteBuf.hasRemaining();
    }

    nextInput() {
        if (!this.hasInput()) {
            throw new RangeError("IllegalStateException Not enough input data");
        }
        return this.charBuf.get();
    }

}

const C_SPACE =  0;  // space
const C_WHITE =  1;  // other whitespace
const C_LCURB =  2;  // {
const C_RCURB =  3;  // }
const C_LSQRB =  4;  // [
const C_RSQRB =  5;  // ]
const C_COLON =  6;  // :
const C_COMMA =  7;  // ,
const C_QUOTE =  8;  // "
const C_BACKS =  9;  // \
const C_SLASH = 10;  // /
const C_PLUS  = 11;  // +
const C_MINUS = 12;  // -
const C_POINT = 13;  // .
const C_ZERO  = 14;  // 0
const C_DIGIT = 15;  // 123456789
const C_LOW_A = 16;  // a
const C_LOW_B = 17;  // b
const C_LOW_C = 18;  // c
const C_LOW_D = 19;  // d
const C_LOW_E = 20;  // e
const C_LOW_F = 21;  // f
const C_LOW_L = 22;  // l
const C_LOW_N = 23;  // n
const C_LOW_R = 24;  // r
const C_LOW_S = 25;  // s
const C_LOW_T = 26;  // t
const C_LOW_U = 27;  // u
const C_ABCDF = 28;  // ABCDF
const C_E     = 29;  // E
const C_ETC   = 30;  // everything else

const __ = -1;

const ascii_class = [
    __,      __,      __,      __,      __,      __,      __,      __,
    __,      C_WHITE, C_WHITE, __,      __,      C_WHITE, __,      __,
    __,      __,      __,      __,      __,      __,      __,      __,
    __,      __,      __,      __,      __,      __,      __,      __,

    C_SPACE, C_ETC,   C_QUOTE, C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_PLUS,  C_COMMA, C_MINUS, C_POINT, C_SLASH,
    C_ZERO,  C_DIGIT, C_DIGIT, C_DIGIT, C_DIGIT, C_DIGIT, C_DIGIT, C_DIGIT,
    C_DIGIT, C_DIGIT, C_COLON, C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,

    C_ETC,   C_ABCDF, C_ABCDF, C_ABCDF, C_ABCDF, C_E,     C_ABCDF, C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_LSQRB, C_BACKS, C_RSQRB, C_ETC,   C_ETC,

    C_ETC,   C_LOW_A, C_LOW_B, C_LOW_C, C_LOW_D, C_LOW_E, C_LOW_F, C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_ETC,   C_LOW_L, C_ETC,   C_LOW_N, C_ETC,
    C_ETC,   C_ETC,   C_LOW_R, C_LOW_S, C_LOW_T, C_LOW_U, C_ETC,   C_ETC,
    C_ETC,   C_ETC,   C_ETC,   C_LCURB, C_ETC,   C_RCURB, C_ETC,   C_ETC
];


const GO =  0;  // start
const OK =  1;  // ok
const OB =  2;  // object
const KE =  3;  // key
const CO =  4;  // colon
const VA =  5;  // value
const AR =  6;  // array
const ST =  7;  // string
const ES =  8;  // escape
const U1 =  9;  // u1
const U2 = 10;  // u2
const U3 = 11;  // u3
const U4 = 12;  // u4
const MI = 13;  // minus
const ZE = 14;  // zero
const IN = 15;  // integer
const F0 = 16;  // frac0
const FR = 17;  // fraction
const E1 = 18;  // e
const E2 = 19;  // ex
const E3 = 20;  // exp
const T1 = 21;  // tr
const T2 = 22;  // tru
const T3 = 23;  // true
const F1 = 24;  // fa
const F2 = 25;  // fal
const F3 = 26;  // fals
const F4 = 27;  // false
const N1 = 28;  // nu
const N2 = 29;  // nul
const N3 = 30;  // null

const state_transition_table = [
    /*               white                                      1-9                                   ABCDF  etc
     space |  {  }  [  ]  :  ,  "  \  /  +  -  .  0  |  a  b  c  d  e  f  l  n  r  s  t  u  |  E  | pad */
    /*start  GO*/  GO,GO,-6,__,-5,__,__,__,ST,__,__,__,MI,__,ZE,IN,__,__,__,__,__,F1,__,N1,__,__,T1,__,__,__,__,__,
    /*ok     OK*/  OK,OK,__,-8,__,-7,__,-3,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*object OB*/  OB,OB,__,-9,__,__,__,__,ST,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*key    KE*/  KE,KE,__,__,__,__,__,__,ST,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*colon  CO*/  CO,CO,__,__,__,__,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*value  VA*/  VA,VA,-6,__,-5,__,__,__,ST,__,__,__,MI,__,ZE,IN,__,__,__,__,__,F1,__,N1,__,__,T1,__,__,__,__,__,
    /*array  AR*/  AR,AR,-6,__,-5,-7,__,__,ST,__,__,__,MI,__,ZE,IN,__,__,__,__,__,F1,__,N1,__,__,T1,__,__,__,__,__,
    /*string ST*/  ST,__,ST,ST,ST,ST,ST,ST,-4,ES,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,__,
    /*escape ES*/  __,__,__,__,__,__,__,__,ST,ST,ST,__,__,__,__,__,__,ST,__,__,__,ST,__,ST,ST,__,ST,U1,__,__,__,__,
    /*u1     U1*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,U2,U2,U2,U2,U2,U2,U2,U2,__,__,__,__,__,__,U2,U2,__,__,
    /*u2     U2*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,U3,U3,U3,U3,U3,U3,U3,U3,__,__,__,__,__,__,U3,U3,__,__,
    /*u3     U3*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,U4,U4,U4,U4,U4,U4,U4,U4,__,__,__,__,__,__,U4,U4,__,__,
    /*u4     U4*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,ST,ST,ST,ST,ST,ST,ST,ST,__,__,__,__,__,__,ST,ST,__,__,
    /*minus  MI*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,ZE,IN,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*zero   ZE*/  OK,OK,__,-8,__,-7,__,-3,__,__,__,__,__,F0,__,__,__,__,__,__,E1,__,__,__,__,__,__,__,__,E1,__,__,
    /*int    IN*/  OK,OK,__,-8,__,-7,__,-3,__,__,__,__,__,F0,IN,IN,__,__,__,__,E1,__,__,__,__,__,__,__,__,E1,__,__,
    /*frac0  F0*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,FR,FR,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*frac   FR*/  OK,OK,__,-8,__,-7,__,-3,__,__,__,__,__,__,FR,FR,__,__,__,__,E1,__,__,__,__,__,__,__,__,E1,__,__,
    /*e      E1*/  __,__,__,__,__,__,__,__,__,__,__,E2,E2,__,E3,E3,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*ex     E2*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,E3,E3,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*exp    E3*/  OK,OK,__,-8,__,-7,__,-3,__,__,__,__,__,__,E3,E3,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*tr     T1*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,T2,__,__,__,__,__,__,__,
    /*tru    T2*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,T3,__,__,__,__,
    /*true   T3*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,OK,__,__,__,__,__,__,__,__,__,__,__,
    /*fa     F1*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,F2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,
    /*fal    F2*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,F3,__,__,__,__,__,__,__,__,__,
    /*fals   F3*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,F4,__,__,__,__,__,__,
    /*false  F4*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,OK,__,__,__,__,__,__,__,__,__,__,__,
    /*nu     N1*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,N2,__,__,__,__,
    /*nul    N2*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,N3,__,__,__,__,__,__,__,__,__,
    /*null   N3*/  __,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,OK,__,__,__,__,__,__,__,__,__
];

const MODE_ARRAY  = 0;
const MODE_DONE   = 1;
const MODE_KEY    = 2;
const MODE_OBJECT = 3;

export class JsonPullParser {

    constructor({ stream = new JsonBuffer() } = {}) {


        this.depth = 2048;
        this.currentValue = [];
        this.parsedCharacterCount = 0;
        this.event1 = NEED_MORE_INPUT;
        this.event2 = NEED_MORE_INPUT;

        this.stack = ByteBuffer.createBuffer({ type: Uint8Array, capacity: 16 });
        this.top = -1;
        this.state = GO;
        this.push(MODE_DONE);
        this.stream = stream;
    }

    getCurrentDouble() {
        return parseFloat(this.getCurrentString());
    }

    getCurrentInt() {
        return parseInt(this.getCurrentString());
    }

    getCurrentString() {
        return char.charBufferToString(this.currentValue);
    }

    getMaxDepth() {
        return this.depth;
    }

    getParsedCharacterCount() {
        return this.parsedCharacterCount;
    }

    getStream() {
        return this.stream;
    }

    nextEvent() {
        try {
            while (this.event1 === NEED_MORE_INPUT) {
                if (!this.stream.hasInput()) {
                    if (this.stream.isDone()) {
                        if (this.state !== OK) {
                            let r = this.stateToEvent();
                            if (r !== NEED_MORE_INPUT) {
                                this.state = OK;
                                return r;
                            }
                        }
                        return this.state === OK && this.pop(MODE_DONE) ? EOF : ERROR;
                    }
                    return NEED_MORE_INPUT;
                }
                this.parse(this.stream.nextInput());
            }
        } catch (e) {
            return ERROR;
        }
        let r = this.event1;
        if (this.event1 !== ERROR) {
            this.event1 = this.event2;
            this.event2 = NEED_MORE_INPUT;
        }
        return r;
    }

    parse(nextChar) {
        this.parsedCharacterCount++;
        let nextClass;
        if (nextChar >= 128) {
            nextClass = C_ETC;
        } else {
            nextClass = ascii_class[nextChar];
            if (nextClass <= __) {
                this.event1 = ERROR;
                return;
            }
        }
        // Get the next state from the state transition table.
        let nextState = state_transition_table[(this.state << 5) + nextClass];
        if (nextState >= 0) {
            if (nextState >= ST && nextState <= E3) {
                // According to the 'state_transition_table' we don't need to check
                // for "state <= E3". There is no way we can get here without 'state'
                // being less than or equal to E3.
                // if (state >= ST && state <= E3) {
                if (this.state >= ST) {
                    this.currentValue.push(nextChar);
                } else {
                    this.currentValue = [];
                    if (nextState !== ST) {
                        this.currentValue.push(nextChar);
                    }
                }
            } else if (nextState === OK) {
                // end of token identified, convert state to result
                this.event1 = this.stateToEvent();
            }
            // Change the state.
            this.state = nextState;
        } else {
            // Or perform one of the actions.
            this.performAction(nextState);
        }
    }

    performAction(action) {
        switch (action) {
            // empty }
            case -9:
                if (!this.pop(MODE_KEY)) {
                    this.event1 = ERROR;
                    return;
                }
                this.state = OK;
                this.event1 = END_OBJECT;
                break;
            // }
            case -8:
                if (!this.pop(MODE_OBJECT)) {
                    this.event1 = ERROR;
                    return;
                }
                this.event1 = this.stateToEvent();
                if (this.event1 === NEED_MORE_INPUT) {
                    this.event1 = END_OBJECT;
                } else {
                    this.event2 = END_OBJECT;
                }
                this.state = OK;
                break;
            // ]
            case -7:
                if (!this.pop(MODE_ARRAY)) {
                    this.event1 = ERROR;
                    return;
                }
                this.event1 = this.stateToEvent();
                if (this.event1 === NEED_MORE_INPUT) {
                    this.event1 = END_ARRAY;
                } else {
                    this.event2 = END_ARRAY;
                }
                this.state = OK;
                break;
            // {
            case -6:
                if (!this.push(MODE_KEY)) {
                    this.event1 = ERROR;
                    return;
                }
                this.state = OB;
                this.event1 = START_OBJECT;
                break;
            // [
            case -5:
                if (!this.push(MODE_ARRAY)) {
                    this.event1 = ERROR;
                    return;
                }
                this.state = AR;
                this.event1 = START_ARRAY;
                break;
            // "
            case -4:
                if (this.stack[this.top] === MODE_KEY) {
                    this.state = CO;
                    this.event1 = FIELD_NAME;
                } else {
                    this.state = OK;
                    this.event1 = VALUE_STRING;
                }
                break;
            // ,
            case -3:
                switch (this.stack[this.top]) {
                    case MODE_OBJECT:
                        // A comma causes a flip from object mode to key mode.
                        if (!this.pop(MODE_OBJECT) || !this.push(MODE_KEY)) {
                            this.event1 = ERROR;
                            return;
                        }
                        this.event1 = this.stateToEvent();
                        this.state = KE;
                        break;
                    case MODE_ARRAY:
                        this.event1 = this.stateToEvent();
                        this.state = VA;
                        break;
                    default:
                        this.event1 = ERROR;
                        return;
                }
                break;
            // :
            case -2:
                // A colon causes a flip from key mode to object mode.
                if (!this.pop(MODE_KEY) || !this.push(MODE_OBJECT)) {
                    this.event1 = ERROR;
                    return;
                }
                this.state = VA;
                break;
            // Bad action.
            default:
                this.event1 = ERROR;
                return;
        }
    }

    pop(mode) {
        if (this.top < 0 || this.stack[this.top] !== mode) {
            return false;
        }
        --this.top;
        return true;
    }

    push(mode) {
        ++this.top;
        if (this.top >= this.stack.length) {
            if (this.top >= this.depth) {
                return false;
            }
            this.stack = util.copyOf(this.stack, Math.min(this.stack.length * 2, this.depth));
        }
        this.stack[this.top] = mode;
        return true;
    }

    setMaxDepth(depth) {
        this.depth = depth;
    }

    stateToEvent() {
        if (this.state === IN || this.state === ZE) {
            return VALUE_INT;
        } else if (this.state >= FR && this.state <= E3) {
            return VALUE_DOUBLE;
        } else if (this.state === T3) {
            return VALUE_TRUE;
        } else if (this.state === F4) {
            return VALUE_FALSE;
        } else if (this.state === N3) {
            return VALUE_NULL;
        }
        return NEED_MORE_INPUT;
    }

}