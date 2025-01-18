const { deleteRecord } = require('./utils/helper');
const jwt = require('jsonwebtoken'); // Para verificar el token
require('dotenv').config({ path: '.env.local' });

const SECRET_KEY = process.env.JWT_SECRET; // Clave secreta para firmar/verificar el token
const TABLE_NAME = "user";

const deleteRecords = async (email) => {
    try {
        await deleteRecord(TABLE_NAME, email);
        console.log(`Registros eliminados exitosamente para el email: ${email}`);
        return { success: true };
    } catch (err) {
        console.error("Error al eliminar registros: ", err);
        throw new Error('Error al eliminar registros.');
    }
};

const verifyToken = (event) => {
    const token = event.headers?.Authorization?.split(' ')[1]; // Extrae el token del encabezado

    if (!token) {
        throw new Error('Token no proporcionado');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY); // Verifica el token
        console.log('Token verificado:', decoded);
        return decoded; // Devuelve el payload decodificado
    } catch (err) {
        console.error('Error al verificar el token:', err);
        throw new Error('Token inválido o expirado');
    }
};

const processEvent = async (event) => {
    try {
        const decoded = verifyToken(event); // Verifica el token
        const { email } = event.pathParameters; // Obtén el email del parámetro de la ruta

        // Puedes agregar lógica para validar si el email coincide con el del token


        if(decoded.role == "Admin" || decoded.email == email ){
            const resp = await deleteRecords(email);
            return {
                email,
                ...resp
            };
        }else{
            throw new Error('No autorizado para eliminar este usuario');
        }
    } catch (err) {
        console.log("Error:", err);
        throw new Error(err.message || "Error desconocido");
    }
};

exports.handler = async (event) => {
    try {
        const resp = await processEvent(event);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Usuario con email: ${resp.email} eliminado` })
        };
    } catch (err) {
        console.error("Error General:", err);
        return {
            statusCode: 401, // Cambia a 401 para errores de autenticación
            body: JSON.stringify({
                message: "Error al eliminar usuario",
                error: err.message,
                statusCode: 401
            })
        };
    }
};
