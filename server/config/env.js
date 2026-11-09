import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
export const envFilePath = path.resolve(configDirectory, '../.env');

export const loadEnv = () => dotenv.config({ path: envFilePath, override: true });

loadEnv();
