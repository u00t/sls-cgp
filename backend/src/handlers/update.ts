import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo } from '../lib/dynamodb';
import { json } from '../lib/responses';
import { Item } from '../types';

const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is required');
}

export const updateItem = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return json(400, { message: 'Path parameter id is required.' });
    }

    const body = (event.body ? JSON.parse(event.body) : {}) as Partial<Item>;
    const updates: Record<string, string> = {};

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.description === 'string')
      updates.description = body.description.trim();

    if (Object.keys(updates).length === 0) {
      return json(400, { message: 'Provide at least one field to update.' });
    }

    const updateExpressions: string[] = [];
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], idx) => {
      const nameKey = `#field${idx}`;
      const valueKey = `:value${idx}`;
      ExpressionAttributeNames[nameKey] = key;
      ExpressionAttributeValues[valueKey] = value;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
    });

    const now = new Date().toISOString();
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = now;
    updateExpressions.push('#updatedAt = :updatedAt');

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ConditionExpression: 'attribute_exists(id)',
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    const attributes = result.Attributes as Item | undefined;
    return json(200, { attributes });
  } catch (error) {
    console.error('updateItem error', error);
    if ((error as Error).name === 'ConditionalCheckFailedException') {
      return json(404, { message: 'Item not found.' });
    }
    return json(500, { message: 'Failed to update item.' });
  }
};
