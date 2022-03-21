import { APP_SECRET } from '../constants';
import { verify } from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: number;
}

export const decodeAuthHeader = (authHeader: String): AuthTokenPayload => {
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token found');
  }
  return verify(token, APP_SECRET!) as AuthTokenPayload;
};
