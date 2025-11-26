import { APIGatewayProxyResultV2 } from 'aws-lambda';

export const json = (
  statusCode: number,
  payload: Record<string, unknown>,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
