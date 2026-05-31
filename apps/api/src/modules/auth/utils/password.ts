import bcrypt from 'bcrypt';
import logger from '../../../utils/logger.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error({ msg: 'Error hashing password', error });
    throw new Error('Failed to hash password');
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error({ msg: 'Error comparing password', error });
    throw new Error('Failed to compare password');
  }
}
