export type GetMeOutput = {
    userId: string;
    login: string;
};

export type LoginAttributes = {
    code: string;
    redirectUri: string;
    rememberMe: boolean;
};

export type LoginOutput = {
    accessToken: string;
    refreshToken: string;
};
