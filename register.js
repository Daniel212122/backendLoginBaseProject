const { DynamoDB } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const dynamoDB = new DynamoDB.DocumentClient();
const USERS_TABLE = 'user';

const processEvent = async (event) => {
    try {
        const json = JSON.parse(event.body);
        console.log("Json: --", json);

        // Verificar si el usuario ya existe en DynamoDB
        const paramsGet = {
            TableName: USERS_TABLE,
            Key: { email: json.email } // La clave primaria debe ser 'email' o similar
        };

        const existingUser = await dynamoDB.get(paramsGet).promise();

        if (existingUser.Item) {
            return{
                statusCode: 409,
                body: JSON.stringify({
                    message: 'The email is already registered',
                    error: 'The email is already registered.',
                    statusCode:409
                })
            };
        }else{
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(json.password, saltRounds);
            // Crear el nuevo usuario
            const register = {
                userId: uuidv4(),
                name: json.name? json.name:null,
                lastname: json.lastname? json.lastname: null,
                phonenumber: json.phonenumber? json.phonenumber: null,
                email: json.email,
                password: hashedPassword,
                role: json.role? json.role: null,
            };
            const paramsPut = {
                TableName: USERS_TABLE,
                Item: register
            };
            
            await dynamoDB.put(paramsPut).promise();
            console.log("User registered:", register);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    statusCode:200,
                    message: "User registered successfully"
                })
            }
        }

        // Cifrar el password
    } catch (error) {
        console.log('Error processing event:', error);
        throw new Error(error.message || 'Error processing event');
    }
};

exports.handler = async (event) => {
    try {
        const resp = await processEvent(event);
        console.log("resp: ", resp)
        return {
            statusCode: resp.statusCode,
            body: JSON.stringify({
                message:resp.body.message,
                error: resp.body.error || "",
                statusCode: resp.body.statusCode
            })
        };
    } catch (error) {
        console.error("General Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: error.message,
                error: error.message,
                statusCode: 500
            })
        };
    }
};
