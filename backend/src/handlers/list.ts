import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo } from '../lib/dynamodb';
import { json } from '../lib/responses';
import { Item } from '../types';

const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is required');
}

export const listItems = async (): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      }),
    );

    const items = (result.Items as Item[] | undefined) ?? [];
    return json(200, { items });
  } catch (error) {
    console.error('listItems error', error);
    return json(500, { message: 'Failed to list items.' });
  }
};
