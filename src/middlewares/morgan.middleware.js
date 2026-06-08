import morgan from 'morgan';
import logger from '../utils/logger.js';

const stream = {
    write: (message) => logger.info(message.trim()),
};

const skip = () => process.env.NODE_ENV === 'test';

const morganMiddleware = morgan('dev', { stream, skip });

export default morganMiddleware;
