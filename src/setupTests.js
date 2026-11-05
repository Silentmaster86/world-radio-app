import { TextDecoder, TextEncoder } from 'util';

global.IS_REACT_ACT_ENVIRONMENT = true;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
