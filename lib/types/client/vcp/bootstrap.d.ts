export declare const VCP_ENGINE_URL = "/tidy-display/vendor/vcp-engine-v1.js";
/** 引擎是否已就绪(挂 window.__vcpStable.render)。 */
export declare function isVcpEngineReady(): boolean;
/** 加载 v1 渲染引擎(同步 XHR,本地静态文件秒回;失败异步重试 5 次)。幂等。 */
export declare function ensureVcpEngine(): void;
/** 客户端入口调用(带环境守卫);幂等,重复调用只是重试计数继续。 */
export declare function bootstrapVcpEngine(): void;
/** 引擎未就绪时卡片占位文本(渲染层用)。 */
export declare function engineUnavailablePlaceholder(streaming: boolean): string;
//# sourceMappingURL=bootstrap.d.ts.map