import web3 from 'web3';
import { TransactionConfig } from 'web3-core';
import { JapiError, ErrorSerializer } from 'ts-japi';

import request from './request';

const PrimitiveErrorSerializer = new ErrorSerializer();

export default async ({
  params,
  pk,
  nodeUrl,
}: {
  params: TransactionConfig;
  pk: string;
  nodeUrl: string;
}): Promise<
  | { status: 'OK'; data: { tx_id: string } }
  | { status: 'ERROR'; code: number; errors: Array<JapiError> }
> => {
  try {
    const client = new web3(nodeUrl);
    const signedTransaction = await client.eth.accounts.signTransaction(
      params,
      pk
    );

    const response = await request({
      url: nodeUrl,
      method: 'POST',
      data: {
        method: 'eth_sendRawTransaction',
        params: [signedTransaction.rawTransaction],
        id: 1,
        jsonrpc: '2.0',
      },
    });

    if (response.data.error) {
      return {
        status: 'ERROR',
        code: 201,
        errors: [
          {
            title: 'eth_sendRawTransaction error',
            detail: response.data.error.message,
            meta: { nodeResponse: response.data },
            stack: 'Error',
          },
        ],
      };
    }

    return { status: 'OK', data: { tx_id: response.data.result } };
  } catch (error) {
    console.log('sendTransaction error: ', error.message);
    const errorDocument = PrimitiveErrorSerializer.serialize(error);
    return {
      status: 'ERROR',
      code: 500,
      errors: errorDocument.errors,
    };
  }
};
