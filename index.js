const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('mysql2');
const mysql = require('mysql2');
const fs = require('fs');
const axios = require('axios');
const app = express();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const mysql2 = require('mysql2/promise'); // Importa el módulo que admite promesas

const upload = multer({ storage: storage });
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));//faltaba agregar esta linea de codigo
app.listen(3001, () => console.log('Server started'));
app.use(express.json())


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'marce1215',
    database: 'likeme',
    waitForConnections: true,
    connectionLimit: 10, // El número máximo de conexiones en el pool
    queueLimit: 0 // No hay límite en la cola de conexiones

})


app.post('/posts', upload.single('img'), async (req, res) => {

    //   try {
    const { description } = req.body;

    if (!req.file || !req.file.path) {
        console.error('No se proporcionó un archivo válido.');
        res.status(400).json({ message: 'Invalid file provided' });
        return;
    }

    const img = req.file.path;

    // Obtener una conexión del pool
    //const connection = await pool.getConnection();

    const sql = "INSERT INTO posts (img, descripcion) VALUES (?, ?)";
    const values = [img, description];

    // Ejecutar la consulta SQL
    //const [results] = await connection.query(sql, values);
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al insertar datos:', err);
        } else {
            console.log('Datos insertados correctamente.');
        }

        
    });

   // connection.end(); // Cierra la conexión cuando hayas terminado.
    // Ahora puedes acceder a los resultados a través de results
    //console.log('Resultados de la consulta SELECT:', results);

    // Liberar la conexión de vuelta al pool
    //connection.release();

    console.log(req.file);
    console.log(req.file.path);


    res.json({ message: 'Post created' });
    // } 
    // catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: 'Something went wrong' });
    // }
});




// Realiza las operaciones que necesitas con la conexión aquí
// Por ejemplo, puedes ejecutar consultas o realizar operaciones en la base de datos.
// Realizar una consulta SELECT

/*
app.get('/posts', (req, res) => {

    // Realizar una consulta SELECT
    const sql = 'SELECT * FROM posts';
    try {
        connection.query(sql, (err, results) => {
            // Liberar la conexión de vuelta al pool, incluso si hay un error
            //     connection.release();

            if (err) {
                console.error('Error al ejecutar la consulta SELECT:', err);
                res.status(500).json({ message: 'Something went wrong' });
                return;
            }

            // Los resultados de la consulta estarán en la variable 'results'
            console.log('Resultados de la consulta SELECT:', results);

            // Devolver los resultados como respuesta JSON
            res.json(results);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});
*/

function queryAsync(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/posts', async (req, res) => {
    const sql = 'SELECT * FROM posts';

    try {
        // Espera los resultados de la consulta
        const results = await queryAsync(sql);
        
        // Los resultados de la consulta estarán en la variable 'results'
        console.log('Resultados de la consulta SELECT:', results);

        // Devolver los resultados como respuesta JSON
        res.json(results);
    } catch (error) {
        console.error('Error al ejecutar la consulta SELECT:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});



app.delete('/posts/:id', (req, res) => {
    const { id } = req.params;



    // Obtener la URL de la imagen del post que deseamos eliminar
    connection.query("SELECT img FROM posts WHERE id = ?", [id], (err, results) => {
        if (err) {
            //connection.release();
            console.error('Error al obtener la URL de la imagen:', err);
            return res.status(500).json({ message: 'Database query error' });
        }

        if (results.length === 0) {
            //connection.release();
            return res.status(404).json({ message: "Post not found" });
        }

        const imgPath = results[0].img;
        console.log(imgPath + " " + id + " " + results[0].url + " " + results[0].img)
        // Eliminar la imagen de la carpeta "uploads"
        fs.unlink(imgPath, (err) => {
            if (err) {
                //connection.release();
                console.log(err);
                return res.status(500).json({ message: "Something went wrong while deleting the image" });
            }

            // Eliminar el post de la base de datos
            const sql = "DELETE FROM posts WHERE id = ?";
            connection.query(sql, [id], (err) => {
                // connection.release();

                if (err) {
                    console.error('Error al eliminar el post de la base de datos:', err);
                    return res.status(500).json({ message: 'Database query error' });
                }

                res.json({ message: 'Post deleted' });
            });
        });
    });
});

app.put('/posts/:id', (req, res) => {
    const { id } = req.params;
    const { descripcion } = req.body;

    // Verificar si la descripción es undefined o está vacía
    if (descripcion === undefined || descripcion.trim() === '') {
        return res.status(400).json({ message: 'Invalid request. Description is missing or empty.' });
    }

    // Realizar una consulta SQL para actualizar un post en la base de datos
    const sql = "UPDATE posts SET descripcion = ? WHERE id = ?";
    const values = [descripcion, id];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error al actualizar el post:', err);
            res.status(500).json({ message: 'Database query error' });
            return;
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ message: 'Post updated' });
    });
});



