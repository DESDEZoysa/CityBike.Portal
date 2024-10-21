
export class ForgotPassword {
    public UserEmail: string;
    public ResetURL: string;
}


export class ResetForgotPassword {
    public Token: string;
    public Password: string;
    public ConfirmPassword: string;
}
