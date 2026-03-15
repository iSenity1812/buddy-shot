export interface CreateUserInput {
  userId: string; // pre-generated so Profile module can mirror same ID
  email: string;
  username: string;
  passwordHash: string;
}
