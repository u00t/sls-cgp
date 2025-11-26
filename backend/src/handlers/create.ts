import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamo } from '../lib/dynamodb';
import { json } from '../lib/responses';
import { Item } from '../types';

const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is required');
}

export const createItem = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = (event.body ? JSON.parse(event.body) : {}) as Partial<Item>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : undefined;

    if (!name) {
      return json(400, { message: 'Validation error: name is required.' });
    }

    const timestamp = new Date().toISOString();
    const item: Item = {
      id: uuidv4(),
      name,
      description,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)',
      }),
    );

    return json(201, { item });
  } catch (error) {
    console.error('createItem error', error);
    return json(500, { message: 'Failed to create item.' });
  }
};
