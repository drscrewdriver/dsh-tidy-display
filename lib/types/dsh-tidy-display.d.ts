import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
declare module '@deepseek-ai/cordis' {
    interface Context {
        webServer?: {
            register: (route: {
                kind: 'exact' | 'prefix';
                path: string;
                handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
            }) => () => void;
        };
    }
}
export declare const name = "dsh-tidy-display";
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=dsh-tidy-display.d.ts.map