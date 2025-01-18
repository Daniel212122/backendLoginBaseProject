const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { insertOrUpdate } = require('./utils/helper');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');

const SECRET_KEY = process.env.JWT_SECRET;
const USERS_TABLE = process.env.USERS_TABLE;

const dynamo = new DynamoDB();

const verifyToken = (event) => {
    console.log(event.headers)
    const token = event.headers?.Authorization?.split(' ')[1];

    if (!token) {
        throw new Error('Token no proporcionado');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};

const processUpdate = async (event) => {
    console.log("event.body: ",  event.body)
    console.log("event.authorized: ", event.headers.Authorization)
    const decoded = verifyToken(event);

    const body = JSON.parse(event.body);

    // Obtener los datos actuales del usuario
    const existingUser = await dynamo.getItem({
        TableName: USERS_TABLE,
        Key: { email: { S: decoded.email } }, // Email desde el token
    });

    if (!existingUser.Item) {
        throw new Error('Usuario no encontrado.');
    }
    let hashedPassword = null
    let password = body.user?.password?body.user.password:existingUser.Item.password

    if(password != existingUser.Item.password){
        hashedPassword = await bcrypt.hash(body.user.password, 10)
    }
    // Combinar los valores enviados con los existentes
        console.log("body", body)
        console.log(hashedPassword)
    const updatedData = {
        name: body.user.name || existingUser.Item.name?.S || null,
        lastname: body.user.lastname || existingUser.Item.lastname?.S || null,
        phonenumber: body.user.phonenumber || existingUser.Item.phonenumber?.S || null,
        email: decoded.email, // El email no cambia
        password: hashedPassword || existingUser.Item.password?.S  || null,
        role: body.user.role || existingUser.Item.role?.S || null,
    };
    console.log("UpdateData: ", updatedData);

    // Actualizar el usuario en la base de datos
    await insertOrUpdate(USERS_TABLE, updatedData, 'email');

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Datos del usuario actualizados correctamente.' }),
    };
};

exports.handler = async (event) => {
    try {
        const response = await processUpdate(event);
        return response;
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({ message: error.message || 'Error al actualizar datos del usuario.' }),
        };
    }
};
