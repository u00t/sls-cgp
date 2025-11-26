import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo } from '../lib/dynamodb';
import { json } from '../lib/responses';
import { Item } from '../types';

const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is required');
}

export const getItem = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return json(400, { message: 'Path parameter id is required.' });
    }

    const result = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      }),
    );

    const item = result.Item as Item | undefined;

    if (!item) {
      return json(404, { message: 'Item not found.' });
    }

    return json(200, { item });
  } catch (error) {
    console.error('getItem error', error);
    return json(500, { message: 'Failed to get item.' });
  }
};
