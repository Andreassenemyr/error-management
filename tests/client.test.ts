import { Scope } from "../src";
import { NodeClient, setCurrentClient } from "../src/client";
import { getCurrentScope, getIsolationScope, withIsolationScope } from "../src/current-scopes"
import { getDefaultNodeClientOptions } from "./helpers/getDefaultNodeClientOptions";

describe('NodeClient', () => {
    beforeEach(() => {
        getIsolationScope().clear();
        getCurrentScope().clear();
        getCurrentScope().setClient(undefined);
    })

    describe('captureException', () => {
        test('when autoSessionTracking is enabled + error occurs within of request bounds -> requestStatus should be set to Errored', () => {
            const options = getDefaultNodeClientOptions({ autoSessionTracking: true });

            const client = new NodeClient(options);
            setCurrentClient(client);
            client.init();

            console.log('Client Intialized');

            client.initSessionFlusher();

            withIsolationScope((isolationScope) => {
                isolationScope.setRequestSession({ status: 'ok' });

                console.log('Running with IsolationScope.')

                client.captureException(new Error('test'));

                console.log('Captured Exception');

                const requestSession = isolationScope.getRequestSession();
                console.log('Request Session:', requestSession);

                expect(requestSession!.status).toEqual('errored');
            })
        });

        test('when autoSessionTracking is enabled + error occurs outside of request bounds -> requestStatus should not be set to Errored', (done) => {
            const options = getDefaultNodeClientOptions({ autoSessionTracking: true });
            const client = new NodeClient(options);

            setCurrentClient(client);
            client.init();

            client.initSessionFlusher();

            let isolationScope: Scope;
            withIsolationScope((_isolationScope) => {
                _isolationScope.setRequestSession({ status: 'ok' });
                isolationScope = _isolationScope;
            });

            client.captureException(new Error('test'));

            setImmediate(() => {
                const requestSession = isolationScope.getRequestSession();

                console.log(requestSession);
                
                expect(requestSession).toEqual({ status: 'ok' });
                done();

            })
        })
    });
})