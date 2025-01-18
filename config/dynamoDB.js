const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({});

module.exports = {
  dynamoDBClient
}