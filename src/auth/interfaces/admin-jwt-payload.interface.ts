export interface AdminJwtPayload {
  sub: 'admin';
  username: string;
  type: 'access' | 'refresh';
}
