import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleStrategy {
  private client: OAuth2Client;

  constructor() {
    // Use your Google Client ID here
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
      console.error('Error verifying Google ID token:', error);
      throw error;
    }
  }
}
