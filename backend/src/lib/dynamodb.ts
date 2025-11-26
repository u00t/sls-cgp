import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Single shared DocumentClient instance for all handlers.
export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
