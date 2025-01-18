const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs'); // Cambiado a bcryptjs
const jwt = require('jsonwebtoken'); // Importamos jsonwebtoken
require('dotenv').config({ path: '.env.local' });

const SECRET_KEY = process.env.JWT_SECRET; // Clave secreta para firmar el token

module.exports.handler = async (event) => {
  // console.log("event:", event);
  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Email and password are required' }),
    };
  }

  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { email },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          message: "Invalid email or password", 
          error: 'Unauthorized',
          statusCode: 404  
        }),
      };
    }
    console.log("result.Item: ", result.Item)

    const passwordsMatch = await bcrypt.compare(password, result.Item.password);
    const {name, lastname, phonenumber,email, role} = result.Item;

    if (!passwordsMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          message: 'Invalid email or password',
          error: 'Unauthorized',
          statusCode: 401
          }),
      };
    }

    // Generar el token JWT con `role` opcional
    const payload = { email: email, ...(role ? { role  }:{}) }; 
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Expira en 1 hora

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Authentication',
        token,
        name, lastname, phonenumber,email, role
        // user: { ...(user.role && { role: user.role }) }, // Incluye `role` si está definido
      }),
    };
  } catch (error) {
    console.error('Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal Server Error',
        error: "Server Error",
        statusCode: 500
       }),
    };
  }
};
