import { APP_SECRET } from '../constants';
import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: number;
}

export const decodeAuthHeader = (authHeader: String): AuthTokenPayload => {
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token found');
  }
  return jwt.verify(token, APP_SECRET!) as AuthTokenPayload;
};
