const {
    DynamoDBDocumentClient,
    ScanCommand,
    QueryCommand,
    DeleteCommand,
    UpdateCommand,
    BatchWriteCommand 
} = require("@aws-sdk/lib-dynamodb");

const { dynamoDBClient } = require('../config/dynamoDB');
const dynamo = DynamoDBDocumentClient.from(dynamoDBClient);

/**
 * Edit item in DynamoDB table or inserts new if not existing
 * @param {string} tableName // Name of the target table
 * @param {object} item // Object containing all the props for new item or updates for already existing item
 * @param {string} pk // partition key of the item ( necessary for new inserts but not modifiable by the update/edit)
 * @param {string} sk // (optional) sort key of the item ( necessary for new inserts but not modifiable by the update/edit) 
**/
const insertOrUpdate = async (tableName, item, pk, sk) => {

    console.log("[tableName][" + tableName + "]");
    console.log("[item][" + JSON.stringify(item) + "]");
    console.log("[pk][" + pk + "]");
    console.log("[sk][" + sk + "]");
    //console.log("[arguments.length][" + arguments.length + "]");

    const itemKeys = Object.keys(item).filter(k => k !== pk && k !== sk);
    // console.log(itemKeys);

    const command = new UpdateCommand({
        TableName: tableName,
        UpdateExpression: `SET ${itemKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: itemKeys.reduce((accumulator, k, index) => ({
            ...accumulator,
            [`#field${index}`]: k
        }), {}),
        ExpressionAttributeValues: itemKeys.reduce((accumulator, k, index) => ({
            ...accumulator,
            [`:value${index}`]: item[k]
        }), {}),
        Key: {
            [pk]: item[pk],
            ...(sk && { [sk]: item[sk] }),
        },
        ReturnValues: 'ALL_NEW'
    });
    console.log(JSON.stringify(command));
    return await dynamo.send(command);
};

const scanTable = async (tableName) => {
    const command = new ScanCommand({ TableName: tableName });
    // console.log(JSON.stringify(command));
    const { Items } = await dynamo.send(command);
    return Items;
};

const scanTableWithFilter = async (tableName,key, value) => {
    // const filename = process.env.FILENAME
    const params = {
        TableName: tableName,
        FilterExpression: "#key = :value",
        ExpressionAttributeNames: {
            "#key": key // Reemplaza "userId" con el nombre de tu atributo de nombre de archivo
        },
        ExpressionAttributeValues: {
            ":value": value
        }
    };
    // Aquí va el código para ejecutar la consulta y manejar los resultados
    // Por ejemplo:
    try {
        const command = new ScanCommand(params);
        const data = await dynamoDBClient.send(command)
        // Manejar los resultados aquí
        // console.log(data.Items)
        return data.Items;
    } catch (error) {
        console.error("Error al escanear la tabla:", error);
        throw error;
    }
};

const queryTable = async (tableName, key, value) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: key + " = :key",
        ExpressionAttributeValues: {
            ":key": { S: value },
        },
    });
    // console.log(JSON.stringify(command));
    const { Items } = await dynamo.send(command);
    return Items;
}

const scanTableBySortKey = async (tableName, sortKeyValue) => {
    const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: "analysisId = :analysisId",
        ExpressionAttributeValues: {
            ":analysisId": sortKeyValue
        },
    });
    console.log(JSON.stringify(command));
    const { Items } = await dynamo.send(command);
    // console.log("Items", JSON.stringify(Items));
    return Items;
};

const queryTableBySortKey = async (tableName, idValue, sortKeyValue) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "analysisId = :analysisId AND begins_with(id, :id)",
        ExpressionAttributeValues: {
            ":analysisId": idValue,
            ":id": sortKeyValue
        },
    });
    // console.log(JSON.stringify(command));
    const { Items } = await dynamo.send(command);
    return Items;
};
const queryTablewithIndex = async (tableName, index, key, value) => {
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: index,
        KeyConditionExpression: key + " = :key",
        ExpressionAttributeValues: {
            ":key": value,
        },
    });
    // console.log(JSON.stringify(command));
    const { Items } = await dynamo.send(command);
    return Items;
}

const deleteRecord = async (tableName, key) => {
    const command = new DeleteCommand({
        TableName: tableName,
        Key: {
            email: key
        }
    });
    // console.log(JSON.stringify(command));
    const resp = await dynamo.send(command);
    // console.log(JSON.stringify(resp));
};

const batchWrite = async (params) => {
    // Ejecutar la eliminación en lote
    const command = new BatchWriteCommand(params);
    // console.log(JSON.stringify(command));
    const resp = await dynamo.send(command);
    // console.log(JSON.stringify(resp));

};

module.exports = {
    scanTableWithFilter,
    insertOrUpdate,
    scanTable,
    queryTable,
    queryTablewithIndex,
    scanTableBySortKey,
    queryTableBySortKey,
    deleteRecord,
    batchWrite
}