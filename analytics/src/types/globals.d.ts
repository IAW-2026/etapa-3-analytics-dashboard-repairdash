export {};

declare global {
  // Augments Clerk's User.publicMetadata so `user.publicMetadata.role` is typed.
  interface UserPublicMetadata {
    role?: 'super-admin' | (string & {});
  }
}
