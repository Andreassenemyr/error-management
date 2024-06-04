export type DsnProtocol = 'http' | 'https';
export interface HostComponent {
    protocol: DsnProtocol;
    publicKey?: string;
    pass?: string;
    host: string;
    port: string;
    path?: string;
    projectId: string;
}
export declare function dsnToString(dsn: HostComponent, withPassword?: boolean): string;
export declare function dsnFromString(str: string): HostComponent | undefined;
export declare function createDSN(from: string | HostComponent): HostComponent | undefined;
//# sourceMappingURL=dsn.d.ts.map