export const createAuthSlice = (set) => ({
  userInfo: undefined,
  setUserInfo: (userInfo) => set((state) => ({ ...state, userInfo })),
});
