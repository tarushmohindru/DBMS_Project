import { LoginInput, RegisterUserInput } from '../validators/auth.validator';
import { AuthPayload } from '../middleware/auth';
export declare function loginUser(input: LoginInput): Promise<{
    token: string;
    user: AuthPayload;
}>;
export declare function registerUser(input: RegisterUserInput): Promise<any>;
//# sourceMappingURL=auth.service.d.ts.map