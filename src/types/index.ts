export * from '../backend/models/Expense';
export * from '../backend/models/Group';
export * from '../backend/models/Settlement';
export * from '../backend/models/User';

// Navigation types
export type RootStackParamList = {
  Root: undefined;
  Auth: undefined;
  NotFound: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  CreateGroup: undefined;
  Profile: undefined;
  "group/[groupId]": { groupId: string };
  AddExpense: { groupId: string };
  "summary/[groupId]": { groupId: string };
};