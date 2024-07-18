import { Auth } from "./auth";

interface AuthApiPort {
    authenticate(): Promise<Auth>;
}

export {
    AuthApiPort
}
