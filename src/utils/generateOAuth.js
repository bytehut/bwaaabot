import { randomBytes } from 'crypto';

// OAuth state generator for security
function generateState() {
    return randomBytes(16).toString('hex');
}

export default generateState;
