import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo } from '../lib/dynamodb';
import { json } from '../lib/responses';

const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is required');
}

export const deleteItem = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return json(400, { message: 'Path parameter id is required.' });
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)',
      }),
    );

    return json(204, {});
  } catch (error) {
    console.error('deleteItem error', error);
    if ((error as Error).name === 'ConditionalCheckFailedException') {
      return json(404, { message: 'Item not found.' });
    }
    return json(500, { message: 'Failed to delete item.' });
  }
};
