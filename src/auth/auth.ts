// import { AppLogger } from "src/logger/logger.service";
// import { AuthService } from "./auth.service";

export type Auth = {
    userId: string
    accessToken: string
}

// export interface AuthenticationStrategy {
//     authenticate(): Promise<Auth>;
// }

// export class ZerodhaAuthenticationStrategy implements AuthenticationStrategy {

//     constructor(
//         private readonly authService: AuthService,
//         private readonly logger: AppLogger,
//     ) {
//         this.logger.setContext(this.constructor.name)
//     }

//     authenticate = async (): Promise<Auth> => {

//     const requestToken = await this.authService.findExistingRequestToken()
//     if (requestToken) {
//       try {
//         const session = await this.authService.loginWithRequestToken(requestToken)
//         this.logger.log(`logged in successfully, redirecting to home`)
//         session.
//         return {
//             accessToken: session.access_token,
//             userId: session.user_id
//         }
//       } catch (error) {
//         const loginUrl = await this.authService.getLoginUrl()
//         this.logger.log(`redirecting to kite for logging in`)
//         return {
//           url: loginUrl
//         }
//       }
//     } else {
//       this.logger.log(`redirecting to kite for logging in`)
//       const loginUrl = await this.authService.getLoginUrl()
//       return {
//         url: loginUrl
//       }
//     }

//     }
// }
