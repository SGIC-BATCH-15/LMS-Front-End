export interface EmailConfiguration {
  id: string;
  displayName: string;
  sentEmail: string;
  hostname: string;
  port: number;
  protocol: 'SMTP' | 'SMTPS';
  password: string;
  ccEmail?: string;
  createdAt: Date;
}

export const emailConfigurations: EmailConfiguration[] = [
  {
    id: '1',
    displayName: 'fh',
    sentEmail: 'bv@gmail.com',
    hostname: 'smtp.gmail.com',
    port: 587,
    protocol: 'SMTP',
    password: 'your-password-here',
    ccEmail: 'cc@hotel.com',
    createdAt: new Date('2025-12-20'),
  },
];
